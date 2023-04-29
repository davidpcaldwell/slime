//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.file.internal.world.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.world.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		var code = {
			/** @type { slime.jrunscript.file.internal.java.Script } */
			java: $loader.script("java.js"),
			/** @type { slime.jrunscript.file.internal.loader.Script } */
			loader: $loader.script("loader.js")
		};

		var library = {
			java: code.java({
				api: {
					io: $context.library.io
				}
			})
		};

		/** @type { slime.jrunscript.file.world.location.Exports["relative"] } */
		var Location_relative = function(path) {
			return function(pathname) {
				var absolute = pathname.filesystem.relative(pathname.pathname, path);
				return {
					filesystem: pathname.filesystem,
					pathname: absolute
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.file.world.Location } location
		 * @param { slime.$api.Events<{}> } events
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

		/** @type { ReturnType<slime.jrunscript.file.world.Exports["Location"]["file"]["exists"]> } */
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

		/** @type { ReturnType<slime.jrunscript.file.world.Exports["Location"]["directory"]["exists"]> } */
		var Location_directory_exists = function(location) {
			return function(events) {
				var rv = location.filesystem.directoryExists({
					pathname: location.pathname
				})(events);
				if (rv.present) return rv.value;
				throw new Error("Error determining whether directory is present at " + location.pathname);
			}
		}

		/** @type { slime.$api.fp.world.Action<slime.jrunscript.file.world.Location, { created: string }> } */
		var ensureParent = function(location) {
			var it = function(location,events) {
				var parent = Location_relative("../")(location);
				var exists = Location_directory_exists(parent)(events);
				if (!exists) {
					it(parent, events);
					$api.fp.world.now.action(
						location.filesystem.createDirectory,
						{ pathname: parent.pathname }
					);
					events.fire("created", parent.pathname);
				}
			};

			return function(events) {
				it(location,events);
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

		//	TODO	probably the Searchpath construct belongs in jrunscript.shell, or maybe we would have a separate one here based
		//			on a list of Location but it could be turned into a system path via a jrunscript.shell API or something

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

		var Location = {
			relative: Location_relative,
			file: {
				exists: function() {
					return Location_file_exists;
				}
			}
		};

		var loader = code.loader({
			library: {
				Location: Location
			}
		})

		$export({
			providers: library.java.providers,
			filesystems: library.java.filesystems,
			Location: {
				from: {
					os: function(string) {
						return {
							filesystem: library.java.filesystems.os,
							pathname: string
						}
					},
					temporary: function(provider) {
						return filesystemFromSpiTemporary(provider);
					}
				},
				relative: Location_relative,
				parent: function() {
					return Location_relative("../");
				},
				file: {
					exists: function() {
						return Location_file_exists;
					},
					read: {
						stream: function() {
							return function(location) {
								return function(events) {
									var ask = location.filesystem.openInputStream({
										pathname: location.pathname
									});
									return ask(events);
								}
							}
						},
						string: function() {
							return function(location) {
								return function(events) {
									var ask = location.filesystem.openInputStream({
										pathname: location.pathname
									});
									var maybe = ask(events);
									return $api.fp.result(
										maybe,
										$api.fp.Maybe.map(
											function(it) {
												return it.character().asString()
											}
										)
									)
								}
							}
						}
					},
					write: Object.assign(
						/**
						 *
						 * @param { Parameters<slime.jrunscript.file.world.location.file.Exports["write"]>[0] } location
						 * @returns { ReturnType<slime.jrunscript.file.world.location.file.Exports["write"]> } location
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
						},
						{
							string: function(p) {
								return function(location) {
									return function(events) {
										Location_write(
											location,
											events,
											function(stream) {
												var writer = stream.character();
												writer.write(p.value);
												writer.close();
											}
										);
									}
								}
							},
							stream: function(p) {
								return function(location) {
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
								}
							},
							object: {
								text: function() {
									return function(location) {
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
					),
					copy: function(p) {
						return function(location) {
							return function(events) {
								if (p.to.filesystem != location.filesystem) throw new Error("Must be same filesystem.");

								$api.fp.world.now.action(
									ensureParent,
									p.to,
									{
										created: function(e) {
											events.fire("created", e.detail);
										}
									}
								)

								p.to.filesystem.copy({
									from: location.pathname,
									to: p.to.pathname
								})(events);
							}
						}
					},
					move: function(p) {
						return function(location) {
							return function(events) {
								//	TODO	lots of duplication with directory move()
								//	TODO	insert existence check like there? Refactor?
								if (p.to.filesystem != location.filesystem) throw new Error("Must be same filesystem.");

								$api.fp.world.now.action(
									ensureParent,
									p.to,
									{
										created: function(e) {
											events.fire("created", e.detail);
										}
									}
								)

								p.to.filesystem.move({
									from: location.pathname,
									to: p.to.pathname
								})(events);
							}
						}
					},
					/** @type { slime.jrunscript.file.world.Exports["Location"]["file"]["remove"] } */
					remove: function() {
						return function(location) {
							return function() {
								$api.fp.world.now.action(
									location.filesystem.remove,
									{ pathname: location.pathname }
								)
							}
						}
					},
				},
				directory: {
					/** @type { slime.jrunscript.file.world.Exports["Location"]["directory"]["exists"] } */
					exists: function() {
						return Location_directory_exists;
					},
					require: function(p) {
						return function(location) {
							return function(events) {
								var exists = location.filesystem.directoryExists({
									pathname: location.pathname
								})(events);
								if (exists.present) {
									if (!exists.value) {
										if (p && p.recursive) {
											$api.fp.world.now.action(
												ensureParent,
												location,
												{
													created: function(e) {
														events.fire("created", {
															filesystem: location.filesystem,
															pathname: e.detail
														})
													}
												}
											);
										}
										$api.fp.world.now.action(
											location.filesystem.createDirectory,
											{ pathname: location.pathname },
											{
												parentNotFound: function() {

												}
											}
										)
										//	TODO	should push this event back into implementation
										//			this way, we could inform of recursive creations as well
										//			probably in the implementation, payload should be pathname, translated into
										//			location at this layer
										events.fire("created", location);
									} else {
										events.fire("found", location);
									}
								} else {
									throw new Error("Error determining whether directory is present at " + location.pathname);
								}
							}
						}
					},
					move: function(p) {
						return function(location) {
							return function(events) {
								var exists = $api.fp.world.now.question(
									location.filesystem.directoryExists,
									{ pathname: location.pathname }
								);
								if (!exists.present) throw new Error("Could not determine whether " + location.pathname + " exists in " + location.filesystem);
								if (!exists.value) throw new Error("Could not move directory: " + location.pathname + " does not exist (or is not a directory).");

								if (p.to.filesystem != location.filesystem) throw new Error("Must be same filesystem.");

								$api.fp.world.now.action(
									ensureParent,
									p.to,
									{
										created: function(e) {
											events.fire("created", e.detail);
										}
									}
								);

								$api.fp.world.now.action(
									location.filesystem.move,
									{
										from: location.pathname,
										to: p.to.pathname
									}
								);
							}
						}
					},
					/** @type { slime.jrunscript.file.world.Exports["Location"]["directory"]["remove"] } */
					remove: function() {
						return function(location) {
							return function() {
								$api.fp.world.now.action(
									location.filesystem.remove,
									{ pathname: location.pathname }
								)
							}
						}
					},
					list: {
						stream: function(p) {
							/**
							 *
							 * @param { slime.jrunscript.file.world.Location } location
							 * @param { slime.$api.fp.Predicate<slime.jrunscript.file.world.Location> } descend
							 * @param { slime.$api.Events<slime.jrunscript.file.world.location.directory.list.Events> } events
							 * @returns { slime.jrunscript.file.world.Location[] }
							 */
							var process = function(location,descend,events) {
								var listed = $api.fp.world.now.ask(
									location.filesystem.listDirectory({ pathname: location.pathname })
								);
								if (listed.present) {
									/** @type { slime.jrunscript.file.world.Location[] } */
									var rv = [];
									listed.value.forEach(function(name) {
										var it = {
											filesystem: location.filesystem,
											pathname: location.pathname + location.filesystem.separator.pathname + name
										};
										rv.push(it);
										var isDirectory = $api.fp.world.now.question(location.filesystem.directoryExists, { pathname: it.pathname });
										if (isDirectory.present) {
											if (isDirectory.value) {
												if (descend(it)) {
													var contents = process(it,descend,events);
													rv = rv.concat(contents);
												}
											} else {
												//	ordinary file, nothing to do
											}
										} else {
											//	TODO	not exactly the same situation as failing to list the directory, but close enough
											events.fire("failed", it);
										}
									});
									return rv;
								} else {
									events.fire("failed", location);
								}
							};

							return function(location) {
								return function(events) {
									var descend = p.descend || $api.fp.mapAllTo(false);
									var array = process(location,descend,events);
									return $api.fp.Stream.from.array(array);
								}
							}
						}
					},
					loader: {
						synchronous: function(p) {
							return loader.create(p.root);
						}
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
