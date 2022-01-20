//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.file.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.file.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		if (!$context.api) throw new Error("Missing 'api' member of context");
		if ($context.$pwd && typeof($context.$pwd) != "string") {
			throw new Error("$pwd is " + typeof($context.$pwd) + ".");
		}

		/** @type { Partial<slime.jrunscript.file.Exports> } */
		var $exports = {};

		var code = {
			/** @type { slime.jrunscript.file.internal.file.Script } */
			file: $loader.script("file.js"),
			/** @type { slime.jrunscript.file.internal.java.Script } */
			java: $loader.script("java.js"),
			/** @type { slime.jrunscript.file.internal.filesystem.Script } */
			filesystem: $loader.script("filesystem.js"),
			/** @type { slime.jrunscript.file.internal.spi.Script } */
			spi: $loader.script("spi.js")
		}

		var prototypes = {
			Searchpath: {}
		};

		var java = code.java({
			api: {
				io: $context.api.io
			}
		});

		/** @returns { item is slime.jrunscript.file.Pathname } */
		var isPathname = function(item) {
			return item && item.java && item.java.adapt() && $context.api.java.isJavaType(Packages.java.io.File)(item.java.adapt());
		}

		var file = code.file({
			//	Only use of $context.pathext in the module
			Streams: $context.api.io.Streams,
			Resource: $context.api.io.Resource,
			isPathname: isPathname,
			pathext: $context.pathext
		});
		file.Searchpath.prototype = prototypes.Searchpath;

		//	World-oriented filesystem implementations. No world-oriented Cygwin implementation yet.
		var providers = {
			os: new java.FilesystemProvider(Packages.inonit.script.runtime.io.Filesystem.create())
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
				return $context.api.io.Streams.java.adapt(peer.readBinary());
			};

			function pathname_relative(parent, relative) {
				if (typeof(parent) == "undefined") throw new TypeError("'parent' must not be undefined.");
				var peer = was.relative(parent, relative);
				return was.peerToString(peer);
			}

			/** @type { slime.jrunscript.file.world.Filesystem } */
			var filesystem = {
				pathname: function(pathname) {
					return {
						filesystem: filesystem,
						pathname: pathname,
						relative: function(relative) {
							return filesystem.pathname(pathname_relative(pathname, relative));
						},
						File: void(0),
						Directory: void(0),
						isDirectory: void(0)
					}
				},
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
								return $api.Function.impure.ask(function(events) {
									return openInputStream(pathname,events);
								})
							}
						},
						string: function(pathname) {
							return $api.Function.impure.ask(function(events) {
								var stream = openInputStream(pathname,events);
								return (stream) ? stream.character().asString() : null;
							});
						}
					},
					copy: function(p) {
						return $api.Function.impure.tell(function(events) {
							var from = was.newPeer(p.from);
							var to = was.newPeer(p.to);
							$context.api.io.Streams.binary.copy(
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
				},
				Directory: {
					require: function(p) {
						return $api.Function.impure.tell(function() {
							var peer = was.newPeer(p.pathname);
							var parent = was.getParent(peer);
							if (!parent.exists() && !p.recursive) throw new Error();
							if (!peer.exists()) {
								was.createDirectoryAt(peer);
							}
						});
					},
					remove: function(p) {
						return $api.Function.impure.tell(function(e) {
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

		//	Object-oriented filesystem implementations.

		var os = code.filesystem({
			Pathname: file.Pathname,
			Searchpath: file.Searchpath
		});

		/**
		 * @type { slime.jrunscript.file.Exports["filesystems"] }
		 */
		var filesystems = {
			os: new os.Filesystem(providers.os),
			cygwin: ($context.cygwin) ? $loader.file("cygwin.js", {
				cygwin: $context.cygwin,
				Filesystem: os.Filesystem,
				java: java,
				isPathname: isPathname,
				Searchpath: file.Searchpath,
				addFinalizer: $context.addFinalizer
			}) : void(0)
		};

		//	By policy, default filesystem is cygwin filesystem if it is present.  Default can be set through module's filesystem property
		var filesystem = (filesystems.cygwin) ? filesystems.cygwin : filesystems.os;

		//	TODO	perhaps should move selection of default filesystem into these definitions rather than inside file.js
		$exports.Pathname = Object.assign(function Pathname(parameters) {
			if (this.constructor == arguments.callee) throw new Error("Cannot invoke Pathname as constructor.");
			if (typeof(parameters) != "string") throw new TypeError("parameters must be string.");

			/**
			 * @template { any } T
			 * @param { T } rv
			 */
			var decorator = function(rv) {
				rv.constructor = Pathname;
				return rv;
			}

			return decorator(filesystem.Pathname(parameters));
		}, { createDirectory: void(0) });

		$exports.Pathname.createDirectory = function(p) {
			return p.pathname.createDirectory({
				ifExists: p.exists
			});
		};
		$exports.Pathname.createDirectory.exists = {};
		$exports.Pathname.createDirectory.exists.LEAVE = function(dir) {
			return false;
		};
		$exports.Pathname.createDirectory.exists.RECREATE = function(dir) {
			dir.remove();
			return true;
		};

		/**
		 * @type { slime.jrunscript.file.Exports["navigate"] }
		 */
		var navigate = function(p) {
			if (!p.from) throw new TypeError("Required: .from");
			if (!p.to) throw new TypeError("Required: .to");

			var from = p.from;
			var to = p.to;

			/** @returns { item is slime.jrunscript.file.Node } */
			function isNode(item) {
				return Boolean(item.pathname);
			}

			/** @returns { item is slime.jrunscript.file.Directory } */
			function isDirectory(item) {
				return isNode(item) && item.directory;
			}

			if (isNode(from) && !from.pathname.directory && from.parent) {
				from = from.parent;
			} else if (isPathname(from) && from.parent) {
				if (from.parent.directory) {
					from = from.parent.directory;
				} else {
					throw new Error("Required: 'from' parent directory must exist.");
				}
			}

			var startsWith = function(start,under) {
				if (!start) throw new Error("Required: start");
				if (!under) throw new Error("Required: under");
				return under.toString().substring(0,start.toString().length) == start.toString();
			};

			var isBelowBase = function(base,node) {
				if (!base) return false;
				return startsWith(base, node) && node.toString().length > base.toString().length;
			};

			/** @type { slime.jrunscript.file.Directory } */
			var common = (isDirectory(from)) ? from : (function() { throw new Error("Always true; refactor method to narrow type"); })();
			var up = 0;
			while(!startsWith(common,to) || isBelowBase(p.base,common)) {
				up++;
				common = common.parent;
				if (!common) throw new Error("No common parent: " + from + " and " + to);
			}

			var remaining = to.toString().substring(common.toString().length);

			return {
				base: common,
				relative: new Array(up+1).join("../") + remaining
			};
		}

		$exports.navigate = $api.experimental(navigate);

		//	TODO	Searchpath implementation has multiple layers: in os.js, file.js, here ... consolidate and refactor
		$exports.Searchpath = Object.assign(function(parameters) {
			if (this.constructor != arguments.callee) {
				if (parameters instanceof Array) {
					return filesystem.Searchpath(parameters);
				} else {
					throw new TypeError("Illegal argument to Searchpath(): " + parameters);
				}
			} else {
				throw new Error("Cannot invoke Searchpath as constructor.");
			}
		}, { createEmpty: void(0) });
		$exports.Searchpath.createEmpty = function() {
			return $exports.Searchpath([]);
		}
		$exports.Searchpath.prototype = prototypes.Searchpath;

		/**
		 * @param { ConstructorParameters<slime.jrunscript.file.Exports["Loader"]>[0] } p
		 * @constructor
		 */
		function Loader(p) {
			if (typeof(arguments[0]) != "object") throw new TypeError("Argument 0 must be an object.");

			if (arguments[0].pathname && arguments[0].directory) {
				return $api.deprecate(function() {
					/** @returns { slime.jrunscript.file.Directory } */
					var castToDirectory = function(v) {
						return v;
					}

					return new Loader({ directory: castToDirectory(p) });
				})();
			}

			if (arguments[0].directory === null || typeof(arguments[0].directory) == "undefined") {
				throw new TypeError("'directory' property must be present and an object.");
			}

			if (!p.type) p.type = function(file) {
				return $context.api.io.mime.Type.fromName(file.toString());
			}

			/** @type { any } */
			var a = $api.Object.compose(p);

			a.toString = function() {
				return "rhino/file Loader: directory=" + p.directory;
			};

			var getFile = function getFile(path) {
				var file = p.directory.getFile(path);
				//	TODO	could we modify this so that file supported Resource?
				if (file) {
					var data = {
						name: p.directory.toString() + path,
						type: p.type(file),
						getInputStream: function() {
							return file.read($context.api.io.Streams.binary).java.adapt();
						},
						read: {
							binary: function() {
								return file.read($context.api.io.Streams.binary);
							}
						}
					};
					Object.defineProperty(data,"length",{
						get: function() {
							return file.length;
						}
					});
					Object.defineProperty(data,"modified",{
						get: function() {
							return file.modified;
						}
					});
					return data;
				}
				return null;
			}
			a.get = function(path) {
				if (!p.directory) return null;
				return getFile(path);
			}
			a.list = function(path) {
				debugger;
				if (!p.directory) return [];
				//	Validate path
				if (path) {
					// Packages.java.lang.System.err.println("directory list(" + path + ")");
					var last = path.substring(path.length-1);
					if (last == "/") {
						path = path.substring(0,path.length-1);
					}
				}
				var directory = (path) ? p.directory.getSubdirectory(path) : p.directory;
				// Packages.java.lang.System.err.println("Listing " + directory);
				return directory.list().map(function(node) {
					return { path: node.pathname.basename, loader: node.directory, resource: !node.directory };
				});
			}
			a.child = function(prefix) {
				if (!p.directory) return { directory: null };
				return { directory: p.directory.getSubdirectory(prefix) };
			}
			this.source = void(0);
			this.file = void(0);
			this.module = void(0);
			this.value = void(0);
			this.run = void(0);
			this.Child = void(0);
			this.get = void(0);
			this.factory = void(0);
			this.script = void(0);
			var args = Array.prototype.slice.call(arguments);
			args.splice(0,1,a);
			$context.api.io.Loader.apply(this,args);
		}

		$exports.Loader = Loader;

		//	Possibly used for initial attempt to produce HTTP filesystem, for example
		$exports.Filesystem = os.Filesystem;
		$api.experimental($exports,"Filesystem");

		var zip = $loader.file("zip.js", {
			Streams: $context.api.io.Streams
			,Pathname: file.Pathname
			,InputStream: function(_in) {
				return $context.api.io.java.adapt(_in)
			}
		});

		$exports.zip = zip.zip;
		$exports.unzip = zip.unzip;
		$api.experimental($exports, "zip");
		$api.experimental($exports, "unzip");

		$exports.list = file.list;

		$exports.state = {
			list: function(pathname) {
				return function() {
					var argument = $exports.Pathname(pathname);
					if (argument.directory) {
						return argument.directory.list().map(function(node) {
							var suffix = node.directory ? "/" : "";
							return {
								relative: node.pathname.basename + suffix,
								absolute: node.pathname.toString() + suffix
							}
						})
					}
				}
			}
		}

		$exports.action = {
			delete: function(pathname) {
				return Object.assign(
					$api.Events.action(function(events) {
						var remove = function(node) {
							node.remove();
							events.fire("deleted", node.pathname.toString());
						}
						var location = $exports.Pathname(pathname);
						if (location.file) remove(location.file);
						if (location.directory) remove(location.directory);
					}),
					{
						toString: function() { return "delete: " + pathname; }
					}
				)
			},
			write: function(p) {
				return Object.assign(
					$api.Events.action(function(events) {
						var location = $exports.Pathname(p.location);
						var parent = location.parent;
						if (parent.file) throw new Error("Parent pathname " + parent + " is an ordinary file.");
						if (!parent.directory) {
							if (p.createDirectory) {
								parent.createDirectory({
									recursive: true
								});
							}
						}
						if (location.file) {
							if (p.exists == "fail") throw new Error("Pathname " + location + " already exists.");
							if (p.exists == "leave") return;
						}
						location.write(p.content, { append: false });
						events.fire("wrote", p.content);
					}),
					{
						toString: function() { return "write string to " + p.location; }
					}
				)
			}
		}

		//	TODO	probably does not need to use __defineGetter__ but can use function literal?
		var workingDirectory = function() {
			//	TODO	the call used by jsh.shell to translate OS paths to paths from this package can probably be used here
			if ($context.$pwd) {
				var osdir = filesystems.os.Pathname($context.$pwd);
				if (filesystem == filesystems.cygwin) {
					osdir = filesystems.cygwin.toUnix(osdir);
				}
				return osdir.directory;
			}
		};
		$exports.__defineGetter__("workingDirectory", workingDirectory);
		//	Property only makes sense in context of an execution environment, so moving to jsh.shell (other environments can provide their
		//	own mechanisms)

		$exports.Streams = $context.api.io.Streams;
		$exports.java = $context.api.io.java;

		$export(
			$api.Function.result(
				(
					function() {
						/** @type { slime.jrunscript.file.Exports } */
						var rv = {
							filesystems: filesystems,
							filesystem: filesystem,
							Pathname: $exports.Pathname,
							navigate: $exports.navigate,
							Searchpath: $exports.Searchpath,
							Loader: $exports.Loader,
							Filesystem: $exports.Filesystem,
							zip: $exports.zip,
							unzip: $exports.unzip,
							list: $exports.list,
							state: $exports.state,
							action: $exports.action,
							world: {
								filesystems: {
									os: toWorldFilesystem(providers.os)
								}
							},
							Streams: $exports.Streams,
							java: $exports.java,
							workingDirectory: void(0)
						}
						Object.defineProperty(rv, "workingDirectory", {
							get: workingDirectory,
							enumerable: true
						});
						return rv;
					}
				)(),
				function($exports) {
					$api.deprecate($exports.Searchpath,"createEmpty");
					$api.deprecate($exports,"workingDirectory");
					$api.deprecate($exports,"Streams");
					$api.deprecate($exports,"java");
					return $exports;
				}
			)
		);
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export)
