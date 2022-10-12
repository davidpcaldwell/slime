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
			/** @type { slime.jrunscript.file.internal.filesystem.Script } */
			filesystem: $loader.script("filesystem.js"),
			/** @type { slime.jrunscript.file.internal.spi.Script } */
			spi: $loader.script("spi.js"),
			/** @type { slime.jrunscript.file.internal.world.Script } */
			world: $loader.script("world.js")
		}

		/** @type { { world: slime.jrunscript.file.internal.world.Exports } } */
		var library = (
			function() {
				return {
					world: code.world({
						library: {
							io: $context.api.io
						}
					})
				}
			}
		)();

		var prototypes = {
			Searchpath: {}
		};

		var file = code.file({
			//	Only use of $context.pathext in the module
			library: {
				java: $context.api.java
			},
			Streams: $context.api.io.Streams,
			Resource: $context.api.io.Resource,
			filesystems: library.world.spi.filesystems,
			pathext: $context.pathext
		});
		file.Searchpath.prototype = prototypes.Searchpath;

		//	Object-oriented filesystem implementations.

		var os = code.filesystem({
			Pathname: file.Pathname,
			Searchpath: file.Searchpath
		});

		/**
		 * @type { slime.jrunscript.file.Exports["filesystems"] }
		 */
		var filesystems = {
			os: new os.Filesystem(library.world.providers.os),
			cygwin: ($context.cygwin) ? $loader.file("cygwin.js", {
				cygwin: $context.cygwin,
				Filesystem: os.Filesystem,
				java: (
					function() {
						//	TODO	right now java.js is encapsulated within world.js except here
						/** @type { slime.jrunscript.file.internal.java.Script } */
						var code = $loader.script("java.js");
						return code({
							api: {
								io: $context.api.io
							}
						})
					}
				)(),
				isPathname: file.isPathname,
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

		$exports.Pathname.createDirectory = Object.assign(
			function(p) {
				return p.pathname.createDirectory({
					ifExists: p.exists
				});
			},
			{
				exists: {
					LEAVE: function(dir) {
						return false;
					},
					RECREATE: function(dir) {
						dir.remove();
						return true;
					}
				}
			}
		);

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
			} else if (file.isPathname(from) && from.parent) {
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

		$exports.Streams = $context.api.io.Streams;
		$exports.java = $context.api.io.java;

		$export(
			$api.fp.result(
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
							zip: $exports.zip,
							unzip: $exports.unzip,
							list: $exports.list,
							state: $exports.state,
							action: $exports.action,
							world: library.world,
							object: {
								pathname: function(pathname) {
									return $exports.Pathname(pathname.pathname);
								},
								directory: function(pathname) {
									return $exports.Pathname(pathname.pathname).directory;
								}
							},
							Streams: $exports.Streams,
							java: $exports.java
						}
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
