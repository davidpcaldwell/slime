//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.file.internal.wo.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.wo.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var code = {
			/** @type { slime.jrunscript.file.internal.java.Script } */
			java: $loader.script("java.js"),
			parts: {
				/** @type { slime.jrunscript.file.internal.wo.directory.Script } */
				directory: $loader.script("wo-directory.js"),
				/** @type { slime.jrunscript.file.internal.wo.filesystem.Script } */
				filesystem: $loader.script("wo-filesystem.js")
			}
		};

		/** @type { (fs: slime.jrunscript.file.world.Filesystem) => slime.$api.fp.Transform<string> } */
		var canonicalize = function(filesystem) {
			return function(pathname) {
				var terms = pathname.split(filesystem.separator.pathname);
				var rv = [];
				var RETURN_NULL = false;
				terms.forEach(function(term) {
					if (RETURN_NULL) return;
					if (term == ".") {
						return;
					} else if (term == "..") {
						//	TODO	This seems brittle but causes tests to pass on UNIX-like filesystems. Probably need to revisit.
						if (rv.length == 1 && rv[0] === "") {
							RETURN_NULL = true;
							return;
						} else {
							rv.pop();
						}
					} else {
						rv.push(term);
					}
				});
				return (RETURN_NULL) ? null : rv.join(filesystem.separator.pathname);
			}
		};

		/** @type { slime.jrunscript.file.location.Exports["parent"] } */
		var Location_parent = function() {
			return Location_relative("..");
		};

		/** @type { slime.jrunscript.file.location.Exports["directory"]["relativePath"] } */
		var Location_relative = function(path) {
			return function(pathname) {
				var absolute = pathname.pathname + pathname.filesystem.separator.pathname + path;
				var canonical = canonicalize(pathname.filesystem)(absolute);
				if (canonical === null) return null;
				return {
					filesystem: pathname.filesystem,
					pathname: canonical
				}
			}
		}

		/** @type { slime.$api.fp.world.Means<slime.jrunscript.file.Location, { created: slime.jrunscript.file.Location }> } */
		var ensureParent = function(location) {
			var it = function(location,events) {
				var parent = Location_relative("..")(location);
				var exists = Location_directory_exists(parent)(events);
				if (!exists) {
					it(parent, events);
					$api.fp.world.now.action(
						location.filesystem.createDirectory,
						{ pathname: parent.pathname }
					);
					events.fire("created", parent);
				}
			};

			return function(events) {
				it(location,events);
			}
		}

		/** @type { (location: slime.jrunscript.file.Location) => ReturnType<slime.jrunscript.file.location.file.Exports["write"]["open"]>["wo"] } */
		var Location_write_open_wo = function(location) {
			return function(settings) {
				return function(events) {
					var recurse = (settings && settings.recursive) ? $api.fp.now(ensureParent, $api.fp.world.Means.effect({
						created: function(e) {
							events.fire("createdFolder", e.detail);
						}
					})) : function(parent) {};

					recurse(location);

					return location.filesystem.openOutputStream({
						pathname: location.pathname,
						append: settings && settings.append
					})(events);
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.file.Location } location
		 * @param { slime.$api.event.Emitter<slime.jrunscript.file.world.events.FileOpenForWrite> } events
		 * @param { (to: slime.jrunscript.runtime.io.OutputStream) => void } write
		 */
		var Location_write = function(location,events,write) {
			var ask = location.filesystem.openOutputStream({
				pathname: location.pathname
			});
			var output = ask(events);
			$api.fp.result(
				output,
				$api.fp.pipe(
					$api.fp.Maybe.map(write),
					$api.fp.Maybe.else(function() {
						throw new Error("Could not write to location " + location.pathname);
					})
				)
			);
		};

		/** @type { ReturnType<slime.jrunscript.file.Exports["Location"]["directory"]["exists"]["world"]> } */
		var Location_directory_exists = function(location) {
			return function(events) {
				var rv = location.filesystem.directoryExists({
					pathname: location.pathname
				})(events);
				if (rv.present) return rv.value;
				throw new Error("Error determining whether directory is present at " + location.pathname);
			}
		}

		/** @type { ReturnType<slime.jrunscript.file.Exports["Location"]["file"]["exists"]["world"]> } */
		var Location_file_exists = function(location) {
			return function(events) {
				var ask = location.filesystem.fileExists({ pathname: location.pathname });
				var rv = ask(events);
				if (rv.present) {
					return rv.value;
				} else {
					throw new Error("Error determining whether file is present at " + location.pathname);
				}
			}
		}

		var filesystemFromSpiTemporary = function(provider) {
			return function(p) {
				return function(events) {
					var path = provider.temporary(p)(events);
					return {
						filesystem: provider,
						pathname: path
					}
				}
			};
		};

		var Location_basename = function(location) {
			if (typeof(location.pathname) != "string") throw new TypeError("Does not appear to be location: " + location);
			var tokens = location.pathname.split(location.filesystem.separator.pathname);
			return tokens[tokens.length-1];
		};

		/** @type { slime.$api.fp.Identity<slime.jrunscript.file.Location> } */
		var asLocation = $api.fp.identity;

		var lastModifiedSimple = $api.fp.pipe(
			asLocation,
			$api.fp.Mapping.properties({
				argument: function(p) { return { pathname: p.pathname }},
				partial: $api.fp.pipe(
					$api.fp.property("filesystem"),
					$api.fp.property("fileLastModified"),
					$api.fp.world.Sensor.mapping()
				)
			}),
			$api.fp.Mapping.properties({
				argument: $api.fp.property("argument"),
				mapping: $api.fp.pipe(
					$api.fp.property("partial"),
					$api.fp.Partial.impure.exception( function(p) { return new Error("Could not obtain last modified date for " + p.pathname); })
				)
			}),
			$api.fp.Mapping.invoke
		)

		var Location = {
			relative: Location_relative,
			basename: Location_basename,
			/** @type { slime.jrunscript.file.location.Exports["lastModified"] } */
			lastModified: {
				simple: lastModifiedSimple
			},
			file: {
				exists: {
					simple: $api.fp.world.mapping(Location_file_exists),
					world: function() {
						return Location_file_exists;
					}
				}
			}
		};

		/** @type { slime.$api.fp.world.Means<slime.jrunscript.file.Location,void> } */
		var remove = function(location) {
			return function(events) {
				$api.fp.world.Means.now({
					means: location.filesystem.remove,
					order: { pathname: location.pathname }
				})
			}
		}

		var Location_file_write_old = Object.assign(
			/**
			 *
			 * @param { Parameters<slime.jrunscript.file.location.file.Exports["write"]["old"]>[0] } location
			 * @returns { ReturnType<slime.jrunscript.file.location.file.Exports["write"]["old"]> }
			 */
			function(location) {
				return {
					string: function(p) {
						return function(events) {
							Location_write(
								location,
								events,
								function(stream) {
									var writer = stream.character();
									writer.write(p.value);
									writer.close();
								}
							)
						}
					},
					stream: function(p) {
						return function(events) {
							Location_write(
								location,
								events,
								function(output) {
									$context.library.io.Streams.binary.copy(
										p.input,
										output
									)
								}
							)
						}
					},
					object: {
						text: function(p) {
							return function(events) {
								var ask = location.filesystem.openOutputStream({
									pathname: location.pathname
								});
								return $api.fp.result(
									ask(events),
									$api.fp.Maybe.map(function(stream) {
										return stream.character();
									})
								);
							}
						}
					}
				}
			}
		);

		var Location_file_read = (
			function() {
				/** @type { slime.jrunscript.file.location.file.Exports["read"]["stream"] } */
				var readStream = function() {
					return function(location) {
						return location.filesystem.openInputStream({
							pathname: location.pathname
						});
					}
				};

				/** @type { slime.jrunscript.file.location.file.Exports["read"]["string"]["world"] } */
				var readString = function() {
					return $api.fp.world.Sensor.map({
						subject: $api.fp.identity,
						sensor: readStream(),
						reading: $api.fp.Maybe.map(
							function(it) {
								return it.character().asString();
							}
						)
					});
				};

				return {
					stream: readStream,
					string: {
						world: readString,
						maybe: $api.fp.world.Sensor.old.mapping({
							sensor: readString()
						}),
						simple: $api.fp.Partial.impure.old.exception({
							try: $api.fp.world.Sensor.old.mapping({
								sensor: readString()
							}),
							nothing: function(location) {
								return new Error("Could not read: " + location.pathname);
							}
						})
					},
					properties: {
						simple: $api.fp.Partial.impure.old.exception({
							try: $api.fp.pipe(
								$api.fp.world.Sensor.old.mapping({ sensor: readString() }),
								$api.fp.Maybe.map( $context.library.java.Properties.from.string )
							),
							nothing: function(location) {
								return new Error("Could not read: " + location.pathname);
							}
						})
					}
				}
			}
		)();

		var parts = {
			directory: code.parts.directory({
				ensureParent: ensureParent,
				Location: Location,
				Location_parent: Location_parent,
				Location_basename: Location_basename,
				Location_directory_exists: {
					simple: $api.fp.world.Sensor.old.mapping({ sensor: Location_directory_exists }),
					world: function() { return Location_directory_exists; }
				},
				Location_relative: Location_relative,
				Location_file_write: Location_file_write_old,
				Location_file_read_string: Location_file_read.string,
				remove: remove,
				Store: $context.library.loader.Store
			}),
			filesystem: code.parts.filesystem({
				ensureParent: ensureParent
			})
		};

		/** @type { slime.jrunscript.file.location.Exports["Function"] } */
		var Location_Function = function(p) {
			return function(location) {
				if (Location.file.exists.simple(location)) {
					return p.file(location);
				} else if (parts.directory.exists.simple(location)) {
					return p.directory(location);
				} else {
					throw new Error("Neither file nor directory: " + location.pathname + " in " + location.filesystem);
				}
			}
		}

		$export({
			Location: {
				from: {
					os: function(string) {
						return {
							filesystem: $context.filesystem.os,
							pathname: string
						}
					},
					temporary: function(filesystem) {
						return filesystemFromSpiTemporary(filesystem);
					},
					java: {
						File: function(_file) {
							return {
								filesystem: $context.filesystem.os,
								pathname: $context.filesystem.os.java.codec.File.decode(_file).pathname
							}
						}
					}
				},
				relative: $api.deprecate(parts.directory.relativePath),
				lastModified: Location.lastModified,
				parent: Location_parent,
				basename: Location_basename,
				canonicalize: function(location) {
					var canonicalized = $api.fp.world.now.ask(location.filesystem.canonicalize({ pathname: location.pathname }));
					if (!canonicalized.present) return location;
					return {
						filesystem: location.filesystem,
						pathname: canonicalized.value
					}
				},
				Function: Location_Function,
				posix: {
					//	TODO	this implementation assumes the filesystem supports POSIX; all of those .posix properties below are
					//			actually optional
					attributes: (function() {
						/** @param { slime.jrunscript.file.Location } location */
						var get = function(location) {
							return $api.fp.world.now.ask(
								location.filesystem.posix.attributes.get({ pathname: location.pathname })
							)
						};

						/**
						 * @param { slime.jrunscript.file.Location } location
						 * @param { slime.jrunscript.file.posix.Attributes } attributes
						 */
						var set = function(location,attributes) {
							$api.fp.world.now.tell(
								location.filesystem.posix.attributes.set({
									pathname: location.pathname,
									attributes: attributes
								})
							)
						};

						return {
							get: function(p) {
								return function(events) {
									if (!p.location.filesystem.posix) return $api.fp.Maybe.from.nothing();
									return $api.fp.Maybe.from.some(
										get(p.location)
									);
								}
							},
							set: function(p) {
								return function(events) {
									if (p.location.filesystem.posix) {
										set(p.location, p.attributes);
									}
								}
							},
							update: function(p) {
								return function(events) {
									if (p.location.filesystem.posix) {
										var now = get(p.location);
										var after = p.attributes(now);
										set(p.location, after);
									}
								}
							},
							Update: {
								permissions: {
									set: {
										executable: {
											all: function(value) {
												return function(attributes) {
													return {
														owner: attributes.owner,
														group: attributes.group,
														permissions: {
															owner: {
																read: attributes.permissions.owner.read,
																write: attributes.permissions.owner.write,
																execute: value
															},
															group: {
																read: attributes.permissions.group.read,
																write: attributes.permissions.group.write,
																execute: value
															},
															others: {
																read: attributes.permissions.others.read,
																write: attributes.permissions.others.write,
																execute: value
															}
														}
													};
												}
											}
										}
									}
								}
							}
						}
					})()
				},
				java: {
					File: (
						function() {
							/** @type { (location: slime.jrunscript.file.Location) => slime.$api.fp.Maybe<slime.jrunscript.native.java.io.File> } */
							var maybe = function(location) {
								if (location.filesystem.java) return $api.fp.Maybe.from.some(location.filesystem.java.codec.File.encode(location));
								return $api.fp.Maybe.from.nothing();
							}
							return {
								maybe: maybe,
								simple: $api.fp.now(
									maybe,
									$api.fp.Partial.impure.exception(
										function(location) {
											throw new Error(
												location + " is not from a filesystem that can map pathnames to" +
												" java.io.File objects."
											);
										}
									)
								)
							}
						}
					)()
				},
				file: (function() {
					return {
						exists: Location.file.exists,
						size: function(location) {
							return function(events) {
								var maybe = location.filesystem.fileSize({ pathname: location.pathname })(events);
								if (!maybe.present) throw new Error("Could not get file size for " + location.pathname);
								return maybe.value;
							}
						},
						read: Location_file_read,
						write: {
							old: Location_file_write_old,
							open: function(location) {
								return $api.fp.world.Sensor.api.maybe(Location_write_open_wo(location));
							}
						},
						/** @type { slime.jrunscript.file.location.Exports["file"]["remove"] } */
						remove: {
							world: function() {
								return remove;
							},
							simple: $api.fp.world.Means.output({
								means: remove
							})
						},
					}
				})(),
				directory: parts.directory,
				remove: {
					simple: $api.fp.world.Means.output({
						means: remove
					})
				}
			},
			Filesystem: parts.filesystem,
			os: (function(world) {
				var temporary = (
					/**
					 *
					 * @param { { directory: boolean, remove: boolean }} p
					 * @returns
					 */
					function(p) {
						return function() {
							//	TODO	not idempotent; perhaps should be a Means
							var rv = $api.fp.world.Sensor.now({
								sensor: $context.filesystem.os.temporary,
								subject: {
									directory: p.directory
								}
							});
							if (p.remove) {
								$api.fp.world.Means.now({
									means: $context.filesystem.os.remove,
									order: {
										pathname: rv
									}
								});
							}
							return rv;
						}
					}
				)

				return {
					directory: {
						relativePath: function(relative) {
							return function(base) {
								var f = parts.directory.relativePath(relative);
								var location = {
									filesystem: $context.filesystem.os,
									pathname: base
								};
								return f(location).pathname;
							}
						}
					},
					temporary: {
						pathname: temporary({ directory: false, remove: true }),
						location: $api.fp.impure.Input.map(
							temporary({ directory: false, remove: true }),
							$api.fp.Mapping.properties({
								filesystem: $api.fp.Mapping.all(world),
								pathname: $api.fp.identity
							})
						),
						directory: temporary({ directory: true, remove: false })
					}
				}
			})($context.filesystem.os)
		});

		//	Some old code follows
		//	TODO	probably the Searchpath construct belongs in jrunscript.shell, or maybe we would have a separate one here based
		//			on a list of Location but it could be turned into a system path via a jrunscript.shell API or something

		//	TODO	reading the above, it rather seems that a Searchpath should be a filesystem and array of pathname. That should
		//			be sufficient to turn it into a string. Or there should be two separate types, one like the above, one an array
		//			of Location, and Searchpath should be a union type of them. Only the single-filesystem Searchpath would have
		//			the ability to be encoded as a string.

		// /** @type { slime.jrunscript.file.World["Filesystem"]["from"]["spi"] } */
		// var filesystemFromSpi = function(provider) {
		// 	return {
		// 		Searchpath: {
		// 			parse: function(value) {
		// 				return value.split(provider.separator.searchpath).map(function(pathname) {
		// 					return {
		// 						filesystem: provider,
		// 						pathname: pathname
		// 					}
		// 				});
		// 			},
		// 			string: function(paths) {
		// 				return paths.join(provider.separator.searchpath);
		// 			}
		// 		}
		// 	};
		// };
	}
//@ts-ignore
)($api,$context,$loader,$export);
