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
	 * @param { slime.jrunscript.file.internal.file.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.file.Exports> } $export
	 */
	function (Packages,$api,$context,$export) {
		if (!$context.Resource) throw new Error();

		var $exports_list = {
			NODE: {
				create: function (d, n) {
					return n;
				}
			},
			ENTRY: {
				create: function (d, n) {
					return {
						path: n.toString().substring(d.toString().length),
						node: n
					}
				}
			},
			RESOURCE: {
				filter: function (n) {
					return !n.directory
				},
				create: function (d, n) {
					/** @type { (node: slime.jrunscript.file.Node) => node is slime.jrunscript.file.File } */
					var isFile = function(node) {
						return Boolean(!node.directory);
					};

					if (isFile(n)) {
						return {
							path: n.toString().substring(d.toString().length).replace(/\\/g, "/"),
							resource: n
						}
					}
				}
			}
		}

		/**
		 * @constructor
		 * @param { ConstructorParameters<slime.jrunscript.file.internal.file.Exports["Pathname"]>[0] } parameters
		 */
		function Pathname(parameters) {
			(function assertCanonicalized() {
				var maybeCanonicalize = $api.fp.now(
					parameters.filesystem.canonicalize,
					$api.fp.world.Sensor.mapping()
				);
				var maybeCanonicalized = maybeCanonicalize({ pathname: parameters.pathname });
				if (!maybeCanonicalized.present) throw new Error("This constructor now accepts only canonicalized paths");
				if (parameters.pathname != maybeCanonicalized.value) {
					throw new Error(
						"This constructor now accepts only canonicalized paths, not " + parameters.pathname
						+ ", which canonicalizes to " + maybeCanonicalized.value
					);
				}
			})();

			function Internal(pathname) {
				return new Pathname({ provider: parameters.provider, filesystem: parameters.filesystem, pathname: pathname });
			}

			var filesystem = parameters.filesystem;

			var toString = $api.fp.Thunk.memoize(function () {
				return parameters.pathname;
			});

			this.toString = toString;

			/** @type { slime.jrunscript.file.Location } */
			var location = {
				filesystem: parameters.filesystem,
				pathname: toString()
			};

			/** @type { string } */
			this.basename = void(0);

			Object.defineProperty(
				this,
				"basename",
				{
					enumerable: true,
					get: function() {
						return $context.library.Location.basename(location);
					}
				}
			);

			/** @type { slime.jrunscript.file.Pathname } */
			this.parent = void(0);
			var getParent = $api.fp.Thunk.memoize(function () {
				var parent = $context.library.Location.parent()(location);
				return (parent) ? Internal(parent.pathname) : null;
			});
			Object.defineProperty(
				this,
				"parent",
				{
					enumerable: true,
					get: getParent
				}
			);

			var _peer = parameters.provider.newPeer(parameters.pathname);

			/** @type { slime.jrunscript.file.File } */
			this.file = void(0);
			var getFile = function() {
				if (arguments.length > 0) {
					throw new TypeError("No arguments expected to Pathname.getFile");
				}
				if (!$context.library.Location.file.exists.simple(location)) return null;
				return new File(this, _peer);
			}
			Object.defineProperty(
				this,
				"file",
				{
					enumerable: true,
					get: getFile.bind(this)
				}
			);

			/** @type { slime.jrunscript.file.Directory } */
			this.directory = void(0);
			/** @type { () => slime.jrunscript.file.Directory } */
			var getDirectory = function() {
				if (!$context.library.Location.directory.exists.simple(location)) return null;
				//	TODO	the below appears to be a no-op, equivalent to new Directory(this, _peer), but tests fail without it;
				//			need to investigate
				var pathname = new Pathname({ provider: parameters.provider, filesystem: parameters.filesystem, pathname: parameters.pathname });
				return /** @type { slime.jrunscript.file.Directory } */(new Directory(pathname, _peer));
			}
			Object.defineProperty(
				this,
				"directory",
				{
					enumerable: true,
					get: getDirectory.bind(this)
				}
			);

			//	TODO	have some real work to do here getting type safety together with this heavy overloading
			/** @type { slime.jrunscript.file.Pathname["write"] } */
			//@ts-ignore
			var write = function write(dataOrType, mode) {
				if (!mode) mode = {};

				/**
				 *
				 * @param { slime.jrunscript.file.pathname.WriteMode } mode
				 */
				var prepareWrite = function prepareWrite(mode) {
					$api.deprecate(mode, "overwrite");
					//	TODO	Right now we can specify a file where we do not want to create its directory, and a file where we do want to
					//			create it, but not one where we are willing to create its directory but not parent directories.  Is that OK?

					if ($context.library.Location.directory.exists.simple(location)) {
						throw new Error("Cannot create file at " + toString() + "; a directory exists at that location. Remove it first.");
					}

					if ($context.library.Location.file.exists.simple(location)) {
						var append = mode.append;
						if (typeof (append) == "undefined") {
							if (mode.overwrite) {
								append = false;
							}
						}
						if (append == true) {
							//	OK
						} else if (append == false) {
							//	OK
						} else {
							throw new Error("Cannot create file at " + toString() + "; already exists (use append to override)");
						}
					}
					if (!getParent().directory) {
						if (!mode.recursive) {
							throw new Error("Cannot create file at " + toString() + "; parent directory does not exist (use recursive to override)");
						} else {
							getParent().createDirectory({ recursive: true });
						}
					}
				}

				prepareWrite(mode);

				//	TODO	adapt to use jrunscript/io Resource write method
				var poorResource = new $context.Resource({
					read: void(0),
					write: {
						binary: function(/** @type { slime.jrunscript.runtime.old.resource.WriteMode } */mode) {
							return $context.library.Location.file.write.open(location).simple({
								append: mode.append,
								//	TODO	could use argument here and remove code above, but for now we do this
								recursive: false
							});
						}
					}
				});

				return poorResource.write(dataOrType, mode);
			}

			this.write = write;

			/** @type { slime.jrunscript.file.Pathname["createDirectory"] } */
			this.createDirectory = function (mode) {
				if (!mode) mode = {};

				var exists = (function(mode) {
					if (mode.exists) return mode.exists;
					if (mode.ifExists) return $api.deprecate(mode.ifExists);
					return function() { throw new Error("Cannot create directory; already exists: " + toString()); };
				})(mode);

				if ($context.library.Location.file.exists.simple(location)) {
					throw new Error("Cannot create directory at " + location.pathname + "; file exists at that location. Remove it first.");
				}

				if ($context.library.Location.directory.exists.simple(location)) {
					var existing = getDirectory();
					var proceed = exists(existing);
					if (!proceed) {
						//	We return null if a non-directory file exists but ifExists returns false (do not proceed with creating directory).
						return getDirectory();
					}
				}

				if (mode.recursive) {
					//	TODO	possibly the first part is redundant
					if (!getParent().directory) {
						getParent().createDirectory(mode);
					}
					$context.library.Location.directory.require(location).simple({
						recursive: true
					});
				} else {
					if (!getParent().directory) {
						throw new Error("Could not create: " + toString() + "; parent directory does not exist.");
					}
					$context.library.Location.directory.require(location).simple({
						recursive: false
					});
				}

				return getDirectory();
			};

			/** @type { slime.jrunscript.file.Pathname["os"] } */
			this.os = {
				adapt: function() {
					return location;
				}
			}

			this.java = new function () {
				//	Undocumented; used only by mapPathname, which is used only by Searchpath, all of which are dubious
				this.getPeer = function () {
					return _peer;
				}

				this.adapt = function () {
					return _peer.getHostFile();
				}

				if (_peer.invalidate) {
					this.invalidate = function () {
						_peer.invalidate();
					}
				}
			}

			var __peer = _peer;

			/**
			 *
			 * @param { Pathname } pathname
			 * @param { string } relativePathPrefix
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node } _peer
			 */
			var Node = function Node(pathname, relativePathPrefix, _peer) {
				if (!_peer) {
					_peer = __peer;
				}
				this.toString = function () {
					return pathname.toString();
				}

				var getPathname = function () {
					return pathname;
				}

				this.__defineGetter__("pathname", getPathname);

				var getParent = function () {
					if (pathname.parent == null) return null;
					return pathname.parent.directory;
				}

				this.__defineGetter__("parent", getParent);

				var attributes = $context.library.Location.attributes(location);

				/** @type { () => Date } */
				var getLastModified = function () {
					var f = $api.fp.now(
						attributes.times.modified.get,
						function(q) {
							return function() {
								return $api.fp.world.Question.now({ question: q })
							}
						}
					);
					return $api.fp.now(f(), function(tv) { return new Date(tv); });
				}

				/** @type { (date: Date) => void } */
				var setLastModified = function(date) {
					var set = $api.fp.now(
						parameters.filesystem.attributes.times.modified.set({ pathname: location.pathname }),
						$api.fp.world.Means.effect()
					)
					set(date.getTime());
				}

				Object.defineProperty(this, "modified", {
					enumerable: true,
					get: getLastModified,
					set: setLastModified
				})

				/**
				 *
				 * @param { string } pathString
				 * @returns
				 */
				var getRelativePath = function (pathString) {
					var canonicalize = $api.fp.now(
						parameters.filesystem.canonicalize,
						$api.fp.world.Sensor.mapping(),
						function(f) {
							/** @param { string } string */
							return function(string) {
								return f({ pathname: string })
							}
						},
						$api.fp.Partial.impure.exception(function(pathname) {
							return new Error("Could not canonicalize " + pathname);
						})
					);
					return Internal(canonicalize(pathname.toString() + relativePathPrefix + pathString));
				}
				this.getRelativePath = getRelativePath;

				this.remove = function () {
					//	TODO	Should probably invalidate this object somehow
					//	TODO	Should this return a value of some kind?
					var remove = $context.library.Location.remove({ recursive: true }).maybe;
					var maybe = remove(pathname.os.adapt());
					if (!maybe.present) throw new Error("Could not remove " + this);
				}

				this.move = function (toPathname, mode) {
					if (!mode) mode = {};
					if (typeof (toPathname.directory) == "boolean") {
						//	toPathname is a directory object
						toPathname = toPathname.getRelativePath(pathname.basename);
					}
					if (toPathname.file || toPathname.directory) {
						if (mode.overwrite) {
							if (toPathname.file) {
								toPathname.file.remove();
							} else {
								toPathname.directory.remove();
							}
						} else {
							throw new Error("Cannot move " + this + " to " + toPathname + "; " + toPathname + " already exists.");
						}
					}
					if (!toPathname.parent.directory) {
						if (mode.recursive) {
							toPathname.parent.createDirectory({ recursive: true });
						}
					}
					//	Seems Cygwin-ish but usage unknown
					if (toPathname.java["invalidate"]) {
						toPathname.java["invalidate"]();
					}
					parameters.provider.move(_peer, toPathname.java.getPeer());
					if (toPathname.file) {
						return toPathname.file;
					} else if (toPathname.directory) {
						return toPathname.directory;
					} else {
						throw new Error("Unreachable: moving node that is neither file nor directory.");
					}
				}

				// this.getPathname = getPathname;
				// $api.deprecate(this, "getPathname");
				// this.getParent = getParent;
				// $api.deprecate(this, "getParent");
				// this.setLastModified = setLastModified;
				// this.getLastModified = getLastModified;
				// $api.deprecate(this, "getLastModified");
				// $api.deprecate(this, "setLastModified");

				/** @type { slime.jrunscript.file.Node["copy"] } */
				this.copy = Object.assign(function (target, mode) {
					if (target === null) throw new TypeError("Destination must not be null.");
					/**
					 * @type { (target: any) => target is slime.jrunscript.file.Directory }
					 */
					var isDirectory = function(target) {
						return (target.pathname && isPathname(target.pathname));
					}

					var to = (function () {
						if (isDirectory(target)) {
							//	Assume target is itself a directory
							if (target.pathname.directory) {
								return target.pathname.directory.getRelativePath(pathname.basename);
							} else {
								throw new Error();
							}
						} else if (isPathname(target)) {
							return target;
						} else {
							//	TODO	need better error message here
							throw new Error();
						}
					})();

					if (!mode) mode = {};

					if (!to.parent.directory) {
						if (mode.recursive) {
							to.parent.createDirectory({ recursive: true });
						} else {
							throw new Error("Could not create " + to + "; parent directory does not exist (use 'recursive' property to override)");
						}
					}

					var filter = (mode.filter) ? mode.filter : function (p) {
						if (p.exists) throw new Error(
							"Cannot copy " + p.entry.node
							+ "; node already exists at " + p.exists.pathname.toString()
						);
						return true;
					};

					var getNode = function (pathname) {
						if (pathname.file) return pathname.file;
						if (pathname.directory) return pathname.directory;
					}

					var processFile = function (path, file, topathname) {
						var b = filter({
							entry: {
								path: path,
								node: file
							},
							exists: getNode(topathname)
						});
						if (b) {
							topathname.write(file.resource.read($context.Streams.binary), { append: false });
							var _from = file.pathname.java.adapt().toPath();
							var _to = topathname.java.adapt().toPath();
							var _Files = Packages.java.nio.file.Files;
							if (_from.getFileSystem().supportedFileAttributeViews().contains("posix") && _to.getFileSystem().supportedFileAttributeViews().contains("posix")) {
								var _fpermissions = _Files.getPosixFilePermissions(_from);
								_Files.setPosixFilePermissions(_to, _fpermissions);
							}
							return topathname.file;
						}
					}

					var processDirectory = function (path, directory, topathname) {
						var b = filter({
							entry: {
								path: path,
								node: directory
							},
							exists: getNode(topathname)
						});
						if (b) {
							var rv = (topathname.directory) ? topathname.directory : topathname.createDirectory();
							directory.list({
								type: directory.list.ENTRY
							}).forEach(function (entry) {
								if (entry.node.pathname.directory) {
									processDirectory(path + entry.path, entry.node, topathname.directory.getRelativePath(entry.path));
								} else if (entry.node.pathname.file) {
									processFile(path + entry.path, entry.node, topathname.directory.getRelativePath(entry.path));
								} else {
									//	TODO	probably broken softlink
									debugger;
									throw new Error("Cannot copy " + entry.path);
								}
							});
							return rv;
						}
					}

					if (!this.directory) {
						return processFile("", this, to);
					} else {
						return processDirectory("", this, to);
					}
				}, {
					filter: {
						OVERWRITE: function (p) {
							return true;
						}
					}
				});

				/** @type { boolean } */
				this.directory = void (0);
			}

			/**
			 *
			 * @param { Pathname } pathname
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node } peer
			 */
			var Link = function (pathname, peer) {
				Node.call(this, pathname, parameters.provider.separators.pathname + ".." + parameters.provider.separators.pathname, peer);

				this.directory = null;
			}

			/**
			 *
			 * @param { Pathname } pathname
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node } _peer
			 */
			var File = function File(pathname, _peer) {
				Node.call(this, pathname, parameters.provider.separators.pathname + ".." + parameters.provider.separators.pathname);

				this.directory = false;

				var rdata = {
					name: pathname.toString(),
					read: {
						binary: function () {
							return parameters.provider.read.binary(_peer);
						},
						text: function () {
							return parameters.provider.read.character(_peer);
						}
					}
				};

				Object.defineProperty(rdata, "length", {
					get: function () {
						var length = pathname.java.adapt().length();
						if (typeof (length) == "object") {
							//	Nashorn treats it as object
							length = Number(String(length));
						}
						return length;
					}
				});

				$context.Resource.call(this, rdata);

				Object.defineProperty(this, "resource", {
					get: $api.deprecate((function () {
						return this;
					}).bind(this)),
					enumerable: false
				});

				this.readLines = $api.deprecate(function () {
					return this.read.lines.apply(this, arguments);
				});
			}
			// File.prototype = new Node(this,$filesystem.separators.pathname + ".." + $filesystem.separators.pathname);

			/**
			 *
			 * @param { Pathname } pathname
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node } peer
			 */
			var Directory = function (pathname, peer) {
				this.getRelativePath = void (0);
				this.toString = void (0);

				this.pathname = void(0);
				this.remove = void(0);
				this.parent = void(0);
				this.move = void(0);
				this.copy = void(0);
				this.modified = void(0);
				Node.call(this, pathname, parameters.provider.separators.pathname + "." + parameters.provider.separators.pathname);

				this.toString = (function (was) {
					return function () {
						return was.apply(this, arguments) + "/";
					}
				})(this.toString);

				this.directory = true;

				this.getFile = function (name) {
					return Internal(this.getRelativePath(name).toString()).file;
				}

				this.getSubdirectory = function (name) {
					if (typeof (name) == "string" && !name.length) return this;
					if (!name) throw new TypeError("Missing: subdirectory name.");
					return Internal(this.getRelativePath(name).toString()).directory;
				}

				var toFilter = function (regexp) {
					return function (item) {
						return regexp.test(item.pathname.basename);
					}
				}

				var self = this;

				/** @type { slime.jrunscript.file.Directory["list"] } */
				var list = Object.assign(function(mode) {
					if (!mode) mode = {};
					var filter = mode.filter;
					if (filter instanceof RegExp) {
						filter = toFilter(filter);
					}
					if (!filter) filter = function () { return true; }

					var type = (mode.type == null) ? $exports_list.NODE : mode.type;
					var toReturn = function (rv) {
						var map = function (node) {
							return type.create(self, node);
						};

						if (type.filter) {
							rv = rv.filter(type.filter);
						}

						return rv.map(map);
					};

					var rv;
					if (typeof (mode.descendants) != "undefined") {
						rv = [];
						var add = function (dir) {
							var items = dir.list();
							items.forEach(function (item) {
								if (filter(item)) {
									rv.push(item);
								}
								if (item.directory && mode.descendants(item)) {
									add(item);
								}
							})
						};
						add(this);
						return toReturn(rv);
					} else if (mode.recursive) {
						return $api.deprecate(function () {
							rv = [];
							var add = function (dir) {
								var items = dir.list();
								items.forEach(function (item) {
									var include = filter(item);
									if (include) {
										if (!item.directory) {
											rv.push(item);
										} else {
											var includeContents = (include === true) || (include && include.contents);
											var includeDir = (include === true);
											if (includeDir) {
												rv.push(item);
											}
											if (includeContents) {
												add(item.pathname.directory);
											}
										}
									}
								});
							}

							add(this);

							return toReturn(rv);
						}).call(this);
					} else {
						/**
						 *
						 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node[] } peers
						 * @returns { slime.jrunscript.file.Node[] }
						 */
						var createNodesFromPeers = function (peers) {
							//	This function is written with this kind of for loop to allow accessing a Java array directly
							//	It also uses an optimization, using the peer's directory property if it has one, which a peer would not be
							//	required to have
							/** @type { slime.jrunscript.file.Node[] } */
							var rv = [];
							for (var i = 0; i < peers.length; i++) {
								var pathname = Internal(String(peers[i].getScriptPath()));
								if (pathname.directory) {
									rv.push(pathname.directory);
								} else if (pathname.file) {
									rv.push(pathname.file);
								} else {
									//	broken softlink, apparently
									//@ts-ignore
									rv.push(new Link(pathname, peers[i]));
								}
							}
							return rv;
						}
						var peers = parameters.provider.list(peer);
						rv = createNodesFromPeers(peers);
						rv = rv.filter(filter);
						return toReturn(rv);
					}
				}, { NODE: void(0), RESOURCE: void(0), ENTRY: void(0) });

				this.list = list;
				Object.assign(this.list, {
					CONTENTS: {
						contents: true
					},
					NODE: $exports_list.NODE,
					ENTRY: $exports_list.ENTRY,
					RESOURCE: $exports_list.RESOURCE
				});

				if (parameters.provider.temporary) {
					this.createTemporary = function(p) {
						var _peer = parameters.provider.temporary(peer, p);
						var pathname = Internal(String(_peer.getScriptPath()));
						if (pathname.directory) return pathname.directory;
						if (pathname.file) return pathname.file;
						throw new Error();
					}
					$api.experimental(this, "createTemporary");
				}
			}
			//	Directory.prototype = new Node(this,"");
		}

		/** @returns { item is slime.jrunscript.file.Pathname } */
		var isPathname = function(item) {
			return item && item.java && item.java.adapt() && $context.library.java.isJavaType(Packages.java.io.File)(item.java.adapt());
		}

		/**
		 *
		 * @param { ConstructorParameters<slime.jrunscript.file.internal.file.Exports["Searchpath"]>[0] } parameters
		 */
		var Searchpath = function(parameters) {
			if (!parameters || !parameters.array) {
				throw new TypeError("Illegal argument to new Searchpath(): " + parameters);
			}

			if (!parameters.provider) {
				throw new TypeError("Required: provider property to Searchpath constructor.");
			}
			var array = parameters.array.slice(0);

			this.append = function (pathname) {
				//	TODO	Check to make sure pathname filesystem matches filesystem?
				array.push(pathname);
			}
			$api.deprecate(this, "append");

			var getPathnames = function () {
				return array;
			}
			this.__defineGetter__("pathnames", getPathnames);

			this.getPathnames = getPathnames;
			$api.deprecate(this, "getPathnames");

			this.getCommand = function (name) {
				for (var i = 0; i < array.length; i++) {
					if (array[i].directory) {
						if ($context.pathext) {
							for (var j = 0; j < $context.pathext.length; j++) {
								//	TODO	subtle bugs lurking here: should probably list the directory and make a case-insensitive check
								if (array[i].directory.getFile(name + $context.pathext[j].toLowerCase())) {
									return array[i].directory.getFile(name + $context.pathext[j].toLowerCase());
								}
							}
						} else {
							if (array[i].directory.getFile(name)) {
								return array[i].directory.getFile(name);
							}
						}
					}
				}
				return null;
			}

			this.toString = function () {
				var provider = parameters.provider;
				return getPathnames().map(function (pathname) {
					if (!provider.java) {
						debugger;
					}
					var peer = provider.java.adapt(pathname.java.adapt());
					var mapped = new Pathname({ provider: provider, filesystem: parameters.filesystem, pathname: String(peer.getScriptPath()) });
					return mapped.toString();
				}).join(provider.separators.searchpath);
			}
		}
		Searchpath.createEmpty = function () {
			return new Searchpath({ provider: void(0), filesystem: void(0), array: [] });
		}
		Searchpath.prototype = $context.prototypes.Searchpath;

		$export({
			Searchpath: Searchpath,
			Pathname: Pathname,
			isPathname: isPathname,
			list: $exports_list
		});
	}
	//@ts-ignore
)(Packages, $api, $context, $export)
