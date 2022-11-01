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

		/** @type { slime.jrunscript.file.world.Locations["relative"] } */
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

		/** @type { ReturnType<slime.jrunscript.file.World["Location"]["file"]["exists"]> } */
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

		/** @type { ReturnType<slime.jrunscript.file.World["Location"]["directory"]["exists"]> } */
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

		/** @type { slime.jrunscript.file.World["Filesystem"]["from"]["spi"] } */
		var filesystemFromSpi = function(provider) {
			return {
				temporary: function(p) {
					return function(events) {
						var path = provider.temporary(p)(events);
						return {
							filesystem: provider,
							pathname: path
						}
					}
				},
				Searchpath: {
					parse: function(value) {
						return value.split(provider.separator.searchpath).map(function(pathname) {
							return {
								filesystem: provider,
								pathname: pathname
							}
						});
					},
					string: function(paths) {
						return paths.join(provider.separator.searchpath);
					}
				}
			};
		};

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
			spi: {
				filesystems: library.java.filesystems
			},
			Filesystem: {
				from: {
					spi: filesystemFromSpi
				}
			},
			filesystems: {
				os: filesystemFromSpi(library.java.filesystems.os)
			},
			Location: {
				from: {
					os: function(string) {
						return {
							filesystem: library.java.filesystems.os,
							pathname: string
						}
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
					write: {
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
					},
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
					}
				},
				directory: {
					/** @type { slime.jrunscript.file.World["Location"]["directory"]["exists"] } */
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
