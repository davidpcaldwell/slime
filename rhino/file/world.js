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
	 * @param { slime.loader.Export<slime.jrunscript.file.World> } $export
	 */
	function(Packages,$api,$context,$export) {
		//	World-oriented filesystem implementations. No world-oriented Cygwin implementation yet.
		var providers = {
			os: new $context.module.java.FilesystemProvider(Packages.inonit.script.runtime.io.Filesystem.create())
		};

		/**
		 *
		 * @param { slime.jrunscript.file.internal.java.FilesystemProvider } was
		 * @returns { slime.jrunscript.file.world.Filesystem }
		 */
		function toWorldFilesystem(was) {
			/**
			 *
			 * @param { string } pathname
			 * @param { slime.$api.Events<{ notFound: void }> } events
			 */
			var openInputStream = function(pathname,events) {
				var peer = was.newPeer(pathname);
				if (!peer.exists()) {
					events.fire("notFound");
					return null;
				}
				return $context.library.io.Streams.java.adapt(peer.readBinary());
			};

			/**
			 * @type { slime.jrunscript.file.world.Filesystem["openOutputStream"] }
			 */
			var maybeOutputStream = function(p) {
				return function(events) {
					var peer = was.newPeer(p.pathname);
					var binary = peer.writeBinary(p.append || false);
					return $api.Function.Maybe.value($context.library.io.Streams.java.adapt(binary));
				}
			}

			/**
			 *
			 * @param { string } pathname
			 * @param { slime.$api.Events<{ notFound: void }> } events
			 * @returns
			 */
			var maybeInputStream = function(pathname,events) {
				var peer = was.newPeer(pathname);
				if (!peer.exists()) {
					events.fire("notFound");
					return $api.Function.Maybe.nothing();
				}
				return $api.Function.Maybe.value($context.library.io.Streams.java.adapt(peer.readBinary()));
			}

			var openWriter = function(pathname,events) {
				var peer = was.newPeer(pathname);
				return peer.writeText(false);
			}

			/**
			 *
			 * @param { string } pathname
			 * @returns { slime.jrunscript.file.world.object.Location }
			 */
			function pathname_create(pathname) {
				return {
					filesystem: filesystem,
					pathname: pathname,
					relative: function(relative) {
						return filesystem.pathname(pathname_relative(pathname, relative));
					},
					file: {
						read: {
							stream: void(0),
							string: function() {
								return $api.Function.world.old.ask(function(events) {
									var stream = openInputStream(pathname, events);
									return (stream === null) ? null : stream.character().asString();
								});
							}
						},
						write: {
							string: function(p) {
								return function() {
									var writer = openWriter(pathname);
									writer.write(p.content);
									writer.close();
								}
							}
						},
						copy: function(p) {
							return copy_impure(pathname, p.to);
						},
						exists: file_exists_impure(pathname)
					},
					directory: {
						exists: directory_exists_impure(pathname),
						require: function(p) {
							return directory_require_impure({
								pathname: pathname,
								recursive: Boolean(p && p.recursive)
							});
						},
						remove: function() {
							return directory_remove_impure({
								pathname: pathname
							})
						},
						list: directory_list(pathname)
					}
				}
			}

			/**
			 *
			 * @param { string } parent
			 * @param { string } relative
			 * @returns
			 */
			function pathname_relative(parent, relative) {
				if (typeof(parent) == "undefined") throw new TypeError("'parent' must not be undefined.");
				var peer = was.relative(parent, relative);
				return was.peerToString(peer);
			}

			/**
			 * @param { string } pathname
			 */
			function directory_exists(pathname) {
				var peer = was.newPeer(pathname);
				return peer.exists() && peer.isDirectory();
			}

			/**
			 * @param { string } pathname
			 */
			function file_exists(pathname) {
				var peer = was.newPeer(pathname);
				return peer.exists() && !peer.isDirectory();
			}

			/**
			 *
			 * @param { { pathname: string, recursive: boolean } } p
			 */
			function createDirectory(p) {
				var peer = was.newPeer(p.pathname);
				var parent = was.getParent(peer);
				if (!parent.exists() && !p.recursive) throw new Error("Parent " + parent.getScriptPath() + " does not exist; specify recursive: true to override.");
				was.createDirectoryAt(peer);
			}

			function directory_require_impure(p) {
				return $api.Function.world.old.tell(function() {
					var peer = was.newPeer(p.pathname);
					var parent = was.getParent(peer);
					if (!parent.exists() && !p.recursive) throw new Error("Parent " + parent.getScriptPath() + " does not exist; specify recursive: true to override.");
					if (!peer.exists()) {
						was.createDirectoryAt(peer);
					}
				});
			}

			function directory_remove_impure(p) {
				return $api.Function.world.old.tell(function() {
					var peer = was.newPeer(p.pathname);
					peer.delete();
				});
			}

			/**
			 *
			 * @param { string } pathname
			 */
			function directory_exists_impure(pathname) {
				return function() {
					return $api.Function.world.old.ask(function(events) {
						return directory_exists(pathname);
					});
				}
			}

			/**
			 *
			 * @param { string } pathname
			 */
			function directory_list(pathname) {
				return function() {
					return $api.Function.world.old.ask(function(events) {
						var peer = was.newPeer(pathname);
						return peer.list(null).map(function(node) {
							return pathname_create(String(node.getScriptPath()));
						})
					});
				}
			}

			/**
			 *
			 * @param { string } pathname
			 */
			function file_exists_impure(pathname) {
				return function() {
					return $api.Function.world.old.ask(function(events) {
						var peer = was.newPeer(pathname);
						return peer.exists() && !peer.isDirectory();
					});
				}
			}

			/**
			 *
			 * @param { string } file
			 * @param { string } destination
			 * @returns { slime.$api.fp.world.old.Tell<void> }
			 */
			function copy_impure(file,destination) {
				return $api.Function.world.old.tell(function(events) {
					var from = was.newPeer(file);
					var to = was.newPeer(destination);
					$context.library.io.Streams.binary.copy(
						was.read.binary(from),
						was.write.binary(to, false)
					);
					var _from = from.getHostFile().toPath();
					var _to = to.getHostFile().toPath();
					var _Files = Packages.java.nio.file.Files;
					if (_from.getFileSystem().supportedFileAttributeViews().contains("posix") && _to.getFileSystem().supportedFileAttributeViews().contains("posix")) {
						var _fpermissions = _Files.getPosixFilePermissions(_from);
						_Files.setPosixFilePermissions(_to, _fpermissions);
					}
				});
			}

			/**
			 *
			 * @param { string } source
			 * @param { string } destination
			 * @returns { slime.$api.fp.world.Tell<void> }
			 */
			function copy(source,destination) {
				return function() {
					var from = was.newPeer(source);
					var to = was.newPeer(destination);
					$context.library.io.Streams.binary.copy(
						was.read.binary(from),
						was.write.binary(to, false)
					);
					var _from = from.getHostFile().toPath();
					var _to = to.getHostFile().toPath();
					var _Files = Packages.java.nio.file.Files;
					if (_from.getFileSystem().supportedFileAttributeViews().contains("posix") && _to.getFileSystem().supportedFileAttributeViews().contains("posix")) {
						var _fpermissions = _Files.getPosixFilePermissions(_from);
						_Files.setPosixFilePermissions(_to, _fpermissions);
					}
				}
			}

			/** @type { slime.jrunscript.file.world.Filesystem } */
			var filesystem = {
				openInputStream: function(p) {
					return function(events) {
						return maybeInputStream(p.pathname, events);
					}
				},
				openOutputStream: maybeOutputStream,
				fileExists: function(p) {
					return function(events) {
						return $api.Function.Maybe.value(file_exists(p.pathname));
					}
				},
				directoryExists: function(p) {
					return function(events) {
						return $api.Function.Maybe.value(directory_exists(p.pathname));
					}
				},
				createDirectory: function(p) {
					return function(events) {
						createDirectory({
							pathname: p.pathname,
							recursive: p.recursive
						});
					}
				},
				copy: function(p) {
					return copy(p.from, p.to);
				},
				pathname: pathname_create,
				Pathname: {
					relative: pathname_relative,
					isDirectory: function(pathname) {
						var peer = was.newPeer(pathname);
						return was.exists(peer) && was.isDirectory(peer);
					}
				},
				File: {
					read: {
						stream: {
							bytes: function(pathname) {
								return $api.Function.world.old.ask(function(events) {
									return openInputStream(pathname,events);
								})
							}
						},
						string: function(p) {
							return function(events) {
								if (typeof(p.pathname) == "undefined") throw new TypeError("p.pathname must not be undefined.");
								var stream = openInputStream(p.pathname,events);
								return (stream) ? stream.character().asString() : null;
							};
						}
					},
					copy: function(p) {
						return copy_impure(p.from,p.to);
					}
				},
				Directory: {
					require: directory_require_impure,
					remove: function(p) {
						return $api.Function.world.old.tell(function(e) {
							var peer = was.newPeer(p.pathname);
							if (!peer.exists()) e.fire("notFound");
							if (peer.exists() && !peer.isDirectory()) throw new Error();
							if (peer.exists() && peer.isDirectory()) was.remove(peer);
						});
					}
				}
			};

			return filesystem;
		}

		/** @type { slime.jrunscript.file.world.Locations["relative"] } */
		var Location_relative = function(path) {
			return function(pathname) {
				var absolute = pathname.filesystem.Pathname.relative(pathname.pathname, path);
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
			$api.Function.result(
				output,
				$api.Function.pipe(
					$api.Function.Maybe.map(write),
					$api.Function.Maybe.else(function() {
						throw new Error("Could not write to location " + location.pathname);
					})
				)
			);
		};

		var os = toWorldFilesystem(providers.os);

		$export({
			providers: providers,
			filesystems: {
				os: os
			},
			os: {
				Location: function(string) {
					return {
						filesystem: os,
						pathname: string
					}
				}
			},
			Location: {
				relative: Location_relative,
				parent: function() {
					return Location_relative("../");
				},
				file: {
					exists: function() {
						return function(location) {
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
									return $api.Function.result(
										maybe,
										$api.Function.Maybe.map(
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
						}
					},
					copy: function(p) {
						return function(location) {
							return function(events) {
								if (p.to.filesystem != location.filesystem) throw new Error("Must be same filesystem.");
								p.to.filesystem.copy({
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
						return function(location) {
							return function(events) {
								var rv = location.filesystem.directoryExists({
									pathname: location.pathname
								})(events);
								if (rv.present) return rv.value;
								throw new Error("Error determining whether directory is present at " + location.pathname);
							}
						}
					},
					require: function(p) {
						return function(location) {
							return function(events) {
								var exists = location.filesystem.directoryExists({
									pathname: location.pathname
								})(events);
								if (exists.present) {
									if (!exists.value) {
										var tell = location.filesystem.createDirectory({
											pathname: location.pathname,
											recursive: Boolean(p && p.recursive)
										});
										tell(events);
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
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages,$api,$context,$export);
