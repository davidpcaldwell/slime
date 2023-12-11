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
	 * @param { slime.jrunscript.file.internal.java.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.java.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		/** @type { slime.jrunscript.file.internal.spi.Script } */
		var code = $loader.script("java-spi.js");

		var spi = code();

		var defined = function(value,fallback) {
			if (typeof(value) != "undefined") return value;
			return fallback;
		};

		/**
		 *
		 * @param { string } path
		 * @returns
		 */
		var fixWindowsForwardSlashes = function(path) {
			return path.replace(/\//g, "\\");
		}

		var systems = {
			/** @type { slime.jrunscript.file.internal.java.System } */
			unix: {
				separator: {
					file: "/"
				},
				isAbsolute: function isAbsolute(string) {
					if (typeof(string) == "undefined") throw new TypeError("'string' must not be undefined.")
					if (string.substring(0,1) != "/") {
						return false;
					} else {
						return true;
					}
				},
				isRootPath: function(string) {
					return ( string == "" || string == "/" ) || (string.substring(0,2) == "//" && string.substring(2).indexOf("/") == -1);
				}
			},
			/** @type { slime.jrunscript.file.internal.java.System } */
			windows: {
				separator: {
					file: "\\"
				},
				isAbsolute: $api.fp.pipe(fixWindowsForwardSlashes, function(string) {
					if (string[1] == ":" || string.substring(0,2) == "\\\\") {
						return true;
					} else {
						return false;
					}
				}),
				isRootPath: $api.fp.pipe(fixWindowsForwardSlashes, function(string) {
					if (string.substring(1,2) == ":") {
						return string.length == 3 && string[2] == "\\";
					} else if (string.substring(0,2) == "\\\\") {
						return string.substring(2).indexOf("\\") == -1;
					} else {
						return false;
					}
				})
			}
		};

		/**
		 *
		 * @param { string } separator
		 * @returns
		 */
		var systemForPathnameSeparator = function(separator) {
			return Object.entries(systems).map(function(entry) {
				return entry[1];
			}).find(function(system) {
				return system.separator.file == separator;
			});
		}

		/**
		 *
		 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem } _peer
		 */
		var systemForFilesystem = function(_peer) {
			var separator = String(_peer.getPathnameSeparator());
			return systemForPathnameSeparator(separator);
		}

		/**
		 *
		 * @param { slime.jrunscript.file.internal.java.System } system
		 * @returns
		 */
		function trailingSeparatorRemover(system) {
			/**
			 *
			 * @param { string } path
			 */
			function removeTrailingSeparator(path) {
				var matchTrailingSlash = $api.fp.result(
					/(.*)/,
					$api.fp.RegExp.modify(function(pattern) {
						return pattern + "\\" + system.separator.file + "$";
					})
				);
				var withoutTrailingSlash = matchTrailingSlash.exec(path);
				if (withoutTrailingSlash && !system.isRootPath(path)) {
					return withoutTrailingSlash[1];
				} else {
					return path;
				}
			}
			var fixArgument = (system == systems.windows) ? fixWindowsForwardSlashes : $api.fp.identity;
			return $api.fp.pipe(fixArgument, removeTrailingSeparator);
		}

		/**
		 *
		 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem } _peer
		 */
		function nodeCreator(_peer) {
			var os = systemForFilesystem(_peer);
			/**
			 *
			 * @param { string } path
			 */
			function createNode(path) {
				if (os.isAbsolute(path)) {
					path = spi.canonicalize(path, os.separator.file);
					return _peer.getNode(path);
				} else {
					return _peer.getNode(new Packages.java.io.File(path));
				}
			}
			return createNode;
		}

		var FilesystemProvider = (
			/**
			 *
			 * @constructor
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem } _peer
			 */
			function(_peer) {
				var os = systemForFilesystem(_peer);

				var separators = {
					pathname: String(_peer.getPathnameSeparator()),
					searchpath: String(_peer.getSearchpathSeparator()),
					line: String(_peer.getLineSeparator())
				};

				this.separators = separators;

				var newPeer = nodeCreator(_peer);

				var peerToString = function(peer) {
					return String( peer.getScriptPath() );
				};

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["newPeer"] } */
				this.newPeer = function this_newPeer(string) {
					if (typeof(string) == "undefined") throw new TypeError("'string' must not be undefined.");
					return newPeer(string);
				};

				this.relative = function relative(parent, relative) {
					if (typeof(parent) == "undefined") throw new TypeError("'parent' must not be undefined.");
					var folder = newPeer(parent);
					var _file = new Packages.java.io.File(folder.getHostFile(), relative);
					return _peer.getNode(_file);
				}

				this.importPathname = function(pathname) {
					throw new Error("Theorized to be unused, at least excluding Cygwin.");
					//return new $context.Pathname({ filesystem: this, peer: peer.getNode( pathname.java.adapt() ) });
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["exists"] } */
				this.exists = function(peer) {
					return peer.exists();
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["isDirectory"] } */
				this.isDirectory = function(peer) {
					return peer.isDirectory();
				}

				this.peerToString = peerToString;

				this.isRootPath = os.isRootPath;

				/**
				 *
				 * @param { string } path
				 */
				var newpath = function(path) {
					return spi.getParentPath(path,separators.pathname);
				};

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["getParent"] } */
				this.getParent = function getParent(peer) {
					//	TODO	Skeptical of this implementation; had to make changes when implementing for HTTP filesystem
					var path = String( peer.getScriptPath() );
					if (this.isRootPath(path)) {
						return null;
					} else {
						return this.newPeer(newpath(path));
					}
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["createDirectoryAt"] } */
				this.createDirectoryAt = function(peer) {
					peer.mkdir();
				};

				this.read = new function() {
					/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["read"]["binary"] } */
					this.binary = function(peer) {
						return $context.api.io.Streams.java.adapt(peer.readBinary());
					}

					/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["read"]["character"] } */
					this.character = function(peer) {
						return $context.api.io.Streams.java.adapt(peer.readText()/*, {LINE_SEPARATOR: separators.line}*/);
					}
				}

				this.write = new function() {
					/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["write"]["binary"] } */
					this.binary = function(peer,append) {
						return $context.api.io.Streams.java.adapt(peer.writeBinary(append));
					}
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["getLastModified"] } */
				this.getLastModified = function(peer) {
					var modified = peer.getHostFile().lastModified();
					if (typeof(modified) == "object") {
						//	Nashorn treats it as object
						modified = Number(String(modified));
					}
					return new Date( modified );
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["setLastModified"] } */
				this.setLastModified = function(peer,date) {
					peer.getHostFile().setLastModified( date.getTime() );
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["remove"] } */
				this.remove = function(peer) {
					peer["delete"]();
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["move"] } */
				this.move = function(fromPeer,to) {
					var toPeer = _peer.getNode(to.getHostFile());
					fromPeer.move(toPeer);
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["list"] } */
				this.list = function(peer) {
					return peer.list();
				};

				this.posix = void(0);

				var posix = _peer.isPosix();

				if (posix) {
					/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["posix"] } */
					this.posix = {
						/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["posix"]["attributes"] } */
						attributes: {
							get: function(peer) {
								var rwe = function(set,r,w,e) {
									return {
										read: set.contains(r),
										write: set.contains(w),
										execute: set.contains(e)
									}
								};

								var _attributes = peer.getPosixAttributes();
								var _p = _attributes.permissions();
								var _enums = Packages.java.nio.file.attribute.PosixFilePermission;
								/** @type { slime.jrunscript.file.posix.Permissions } */
								var permissions = {
									owner: rwe(_p, _enums.OWNER_READ, _enums.OWNER_WRITE, _enums.OWNER_EXECUTE),
									group: rwe(_p, _enums.GROUP_READ, _enums.GROUP_WRITE, _enums.GROUP_EXECUTE),
									others: rwe(_p, _enums.OTHERS_READ, _enums.OTHERS_WRITE, _enums.OTHERS_EXECUTE)
								}
								return {
									owner: String(_attributes.owner().getName()),
									group: String(_attributes.group().getName()),
									permissions: permissions
								}
							},
							set: function(peer, value) {
								var _enums = Packages.java.nio.file.attribute.PosixFilePermission;
								var permissions = new Packages.java.util.HashSet();
								if (value.permissions.owner.read) permissions.add(_enums.OWNER_READ);
								if (value.permissions.owner.write) permissions.add(_enums.OWNER_WRITE);
								if (value.permissions.owner.execute) permissions.add(_enums.OWNER_EXECUTE);
								if (value.permissions.group.read) permissions.add(_enums.GROUP_READ);
								if (value.permissions.group.write) permissions.add(_enums.GROUP_WRITE);
								if (value.permissions.group.execute) permissions.add(_enums.GROUP_EXECUTE);
								if (value.permissions.others.read) permissions.add(_enums.OTHERS_READ);
								if (value.permissions.others.write) permissions.add(_enums.OTHERS_WRITE);
								if (value.permissions.others.execute) permissions.add(_enums.OTHERS_EXECUTE);
								peer.setPosixAttributes(
									value.owner,
									value.group,
									permissions
								);
							}
						}
					};
				}

				this.temporary = function(peer,parameters) {
					if (!parameters) parameters = {};
					var prefix = defined(parameters.prefix, "slime");
					var suffix = defined(parameters.suffix, null);
					var directory = defined(parameters.directory, false);
					var jdir = (peer) ? peer.getHostFile() : null;
					var _file = Packages.java.io.File.createTempFile(prefix,suffix,jdir);
					//	If this was request for directory, delete the temp file and create directory with same name
					if (directory) {
						_file["delete"]();
						_file.mkdir();
					}
					return _peer.getNode(_file);
				}

				this.java = new (function(self) {
					this.adapt = function(_jfile) {
						return _peer.getNode(_jfile);
					}
				})(this);
			}
		);

		/**
		 *
		 * @param { slime.jrunscript.file.internal.java.FilesystemProvider } java
		 * @returns { slime.jrunscript.file.world.Filesystem }
		 */
		function toWorldFilesystem(java) {
			/**
			 *
			 * @param { string } pathname
			 * @param { slime.$api.Events<{ notFound: void }> } events
			 */
			var openInputStream = function(pathname,events) {
				var peer = java.newPeer(pathname);
				if (!peer.exists()) {
					events.fire("notFound");
					return null;
				}
				return $context.api.io.Streams.java.adapt(peer.readBinary());
			};

			/**
			 * @type { slime.jrunscript.file.world.Filesystem["openOutputStream"] }
			 */
			var maybeOutputStream = function(p) {
				return function(events) {
					var peer = java.newPeer(p.pathname);
					try {
						var binary = peer.writeBinary(p.append || false);
						return $api.fp.Maybe.from.some($context.api.io.Streams.java.adapt(binary));
					} catch (e) {
						if (/java\.io\.FileNotFoundException\: (.*) \(No such file or directory\)/.test(e.message)) {
							var parent = peer.getParent();
							events.fire("parentNotFound", {
								filesystem: filesystem,
								pathname: String(parent.getScriptPath())
							});
						}
						return $api.fp.Maybe.from.nothing();
					}
				}
			}

			/**
			 *
			 * @param { string } pathname
			 * @param { slime.$api.Events<{ notFound: void }> } events
			 * @returns
			 */
			var maybeInputStream = function(pathname,events) {
				var peer = java.newPeer(pathname);
				if (!peer.exists()) {
					events.fire("notFound");
					return $api.fp.Maybe.from.nothing();
				}
				return $api.fp.Maybe.from.some($context.api.io.Streams.java.adapt(peer.readBinary()));
			}

			var openWriter = function(pathname,events) {
				var peer = java.newPeer(pathname);
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
								return $api.fp.world.old.ask(function(events) {
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
				var peer = java.relative(parent, relative);
				return java.peerToString(peer);
			}

			/**
			 * @param { string } pathname
			 */
			function directory_exists(pathname) {
				var peer = java.newPeer(pathname);
				return peer.exists() && peer.isDirectory();
			}

			/**
			 * @param { string } pathname
			 */
			function file_exists(pathname) {
				var peer = java.newPeer(pathname);
				return peer.exists() && !peer.isDirectory();
			}

			function last_modified(pathname) {
				var peer = java.newPeer(pathname);
				return peer.getHostFile().lastModified();
			}

			function length(pathname) {
				var peer = java.newPeer(pathname);
				return peer.getHostFile().length();
			}

			function directory_require_impure(p) {
				var recursive = function(peer) {
					if (!java.getParent(peer).exists()) {
						recursive(java.getParent(peer));
					}
					java.createDirectoryAt(peer);
				}
				return $api.fp.world.old.tell(function() {
					var peer = java.newPeer(p.pathname);
					var parent = java.getParent(peer);
					if (!parent.exists()) {
						if (!p.recursive) throw new Error("Parent " + parent.getScriptPath() + " does not exist; specify recursive: true to override.");
						recursive(parent);
					}
					if (!peer.exists()) {
						java.createDirectoryAt(peer);
					}
				});
			}

			function directory_remove_impure(p) {
				return $api.fp.world.old.tell(function() {
					var peer = java.newPeer(p.pathname);
					peer.delete();
				});
			}

			/**
			 *
			 * @param { string } pathname
			 */
			function directory_exists_impure(pathname) {
				return function() {
					return $api.fp.world.old.ask(function(events) {
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
					return $api.fp.world.old.ask(function(events) {
						var peer = java.newPeer(pathname);
						return peer.list().map(function(node) {
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
					return $api.fp.world.old.ask(function(events) {
						var peer = java.newPeer(pathname);
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
				return $api.fp.world.old.tell(function(events) {
					var from = java.newPeer(file);
					var to = java.newPeer(destination);
					$context.api.io.Streams.binary.copy(
						java.read.binary(from),
						java.write.binary(to, false)
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
			 * @returns { slime.$api.fp.world.Action<void> }
			 */
			function copy(source,destination) {
				return function() {
					var from = java.newPeer(source);
					var to = java.newPeer(destination);
					$context.api.io.Streams.binary.copy(
						java.read.binary(from),
						java.write.binary(to, false)
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

			/**
			 *
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node } peer
			 * @param { slime.$api.Events<{ created: string }> } events
			 */
			var createAt = function(peer,events) {
				java.createDirectoryAt(peer);
				events.fire("created", String(peer.getScriptPath()));
			}

			/**
			 *
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node } peer
			 * @param { slime.$api.Events<{ created: string }> } events
			 */
			var ensureParent = function(peer,events) {
				var parent = java.getParent(peer);
				ensureParent(parent,events);
				if (!parent.exists()) {
					createAt(parent,events);
				}
			};

			/** @type { slime.jrunscript.file.world.Filesystem } */
			var filesystem = {
				separator: {
					pathname: java.separators.pathname,
					searchpath: java.separators.searchpath
				},
				canonicalize: function(p) {
					return function(events) {
						var peer = java.newPeer(p.pathname);
						try {
							return $api.fp.Maybe.from.some(String(peer.getHostFile().getCanonicalPath()));
						} catch (e) {
							return $api.fp.Maybe.from.nothing();
						}
					}
				},
				openInputStream: function(p) {
					return function(events) {
						return maybeInputStream(p.pathname, events);
					}
				},
				openOutputStream: maybeOutputStream,
				fileExists: function(p) {
					return function(events) {
						return $api.fp.Maybe.from.some(file_exists(p.pathname));
					}
				},
				fileSize: function(p) {
					return function(events) {
						return $api.fp.Maybe.from.some(length(p.pathname));
					}
				},
				fileLastModified: function(p) {
					return function(events) {
						return $api.fp.Maybe.from.some(last_modified(p.pathname));
					}
				},
				directoryExists: function(p) {
					return function(events) {
						return $api.fp.Maybe.from.some(directory_exists(p.pathname));
					}
				},
				createDirectory: function(p) {
					return function(events) {
						var peer = java.newPeer(p.pathname);
						java.createDirectoryAt(peer);
					}
				},
				listDirectory: function(p) {
					return function(events) {
						var peer = java.newPeer(p.pathname);
						if (!peer.exists()) return $api.fp.Maybe.from.nothing();
						var list = peer.list();
						return $api.fp.Maybe.from.some(
							list.map(
								/** @type { slime.$api.fp.Mapping<slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node,string> } */
								function(node) {
									return String(node.getHostFile().getName());
								}
							)
						);
					}
				},
				copy: function(p) {
					return copy(p.from, p.to);
				},
				move: function(p) {
					return function(events) {
						java.move(java.newPeer(p.from), java.newPeer(p.to));
					}
				},
				remove: function(p) {
					return function(events) {
						java.remove(java.newPeer(p.pathname));
					}
				},
				posix: (java.posix) ? {
					attributes: {
						get: function(p) {
							return function(events) {
								return java.posix.attributes.get( java.newPeer(p.pathname) );
							}
						},
						set: function(p) {
							return function(events) {
								java.posix.attributes.set( java.newPeer(p.pathname), p.attributes );
							}
						}
					}
				} : void(0),
				temporary: function(p) {
					return function(events) {
						var parent = (p.parent) ? java.newPeer(p.parent) : null;
						var created = java.temporary(parent, {
							prefix: p.prefix,
							suffix: p.suffix,
							directory: p.directory
						});
						return String(created.getScriptPath());
					}
				},
				pathname: pathname_create,
				Pathname: {
					isDirectory: function(pathname) {
						var peer = java.newPeer(pathname);
						return java.exists(peer) && java.isDirectory(peer);
					}
				},
				File: {
					read: {
						stream: {
							bytes: function(pathname) {
								return $api.fp.world.old.ask(function(events) {
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
					remove: function(p) {
						return $api.fp.world.old.tell(function(e) {
							var peer = java.newPeer(p.pathname);
							if (!peer.exists()) e.fire("notFound");
							if (peer.exists() && !peer.isDirectory()) throw new Error();
							if (peer.exists() && peer.isDirectory()) java.remove(peer);
						});
					}
				}
			};

			return filesystem;
		}

		//	World-oriented filesystem implementations. No world-oriented Cygwin implementation yet.
		var providers = {
			os: new FilesystemProvider(Packages.inonit.script.runtime.io.Filesystem.create())
		};

		var os = toWorldFilesystem(providers.os);

		$export({
			providers: providers,
			filesystems: {
				os: os
			},
			test: {
				FilesystemProvider: FilesystemProvider,
				unix: systems.unix,
				windows: systems.windows,
				systemForPathnameSeparator: systemForPathnameSeparator,
				trailingSeparatorRemover: trailingSeparatorRemover,
				nodeCreator: nodeCreator
			}
		});
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
