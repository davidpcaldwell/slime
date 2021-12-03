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
	 * @param { slime.jrunscript.file.Exports } $exports
	 */
	function(Packages,$api,$context,$loader,$exports) {
		if (!$context.api) throw new Error("Missing 'api' member of context");
		if ($context.$pwd && typeof($context.$pwd) != "string") {
			throw new Error("$pwd is " + typeof($context.$pwd) + ".");
		}

		var code = {
			/** @type { slime.jrunscript.file.internal.file.Script } */
			file: $loader.script("file.js")
		}

		/** @returns { item is slime.jrunscript.file.Pathname } */
		var isPathname = function(item) {
			return item && item.java && item.java.adapt() && $context.api.java.isJavaType(Packages.java.io.File)(item.java.adapt());
		}

		var prototypes = {
			Searchpath: {}
		};

		var file = code.file({
			//	Only use of $context.pathext in the module
			Streams: $context.api.io.Streams,
			Resource: $context.api.io.Resource,
			isPathname: isPathname,
			pathext: $context.pathext
		});
		file.Searchpath.prototype = prototypes.Searchpath;

		var spi = $loader.file("spi.js", {
			Searchpath: file.Searchpath
		});

		var java = $loader.file("java.js", new function() {
			this.spi = spi;

			this.Pathname = file.Pathname;

			this.api = {
				defined: $context.api.js.defined,
				io: $context.api.io
			};
		});

		//	TODO	separate out Cygwin and make it less tightly bound with the rest of this
		var os = $loader.file("filesystem.js", new function() {
			this.java = java;

			this.Pathname = file.Pathname;

			this.api = new function() {
				this.io = $context.api.io;
				this.defined = $context.api.js.defined;
			};

			this.cygwin = $context.cygwin;

			this.Searchpath = file.Searchpath;
			this.isPathname = isPathname;

			this.addFinalizer = $context.addFinalizer;
		});

		var filesystems = {};

		java.FilesystemProvider.os = new java.FilesystemProvider(Packages.inonit.script.runtime.io.Filesystem.create());
		filesystems.os = new os.Filesystem( java.FilesystemProvider.os );

		$exports.filesystems = filesystems;

		if ($context.cygwin) {
			$exports.filesystems.cygwin = $loader.file("cygwin.js", {
				cygwin: $context.cygwin,
				Filesystem: os.Filesystem,
				java: java,
				isPathname: isPathname,
				Searchpath: file.Searchpath,
				addFinalizer: $context.addFinalizer
			});
		}

		//	By policy, default filesystem is cygwin filesystem if it is present.  Default can be set through module's filesystem property
		$exports.filesystem = ($exports.filesystems.cygwin) ? $exports.filesystems.cygwin : $exports.filesystems.os;

		//	TODO	perhaps should move selection of default filesystem into these definitions rather than inside file.js
		$exports.Pathname = Object.assign(function(parameters) {
			if (this.constructor != arguments.callee) {
				var ctor = arguments.callee;

				var decorator = function(rv) {
					rv.constructor = ctor;
					return rv;
				}

				//	not called as constructor but as function
				//	perform a "cast"
				if (typeof(parameters) == "string") {
					return decorator($exports.filesystem.Pathname(parameters));
				} else if (typeof(parameters) == "object" && parameters instanceof String) {
					return decorator($exports.filesystem.Pathname(parameters.toString()));
				} else {
					throw new TypeError("Illegal argument to Pathname(): " + parameters);
				}
			} else {
				throw new Error("Cannot invoke Pathname as constructor.");
			}
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

		// $exports.getRelativePathTo = function(to) {
		// 	// TODO: no test coverage
		// 	return function(from) {
		// 		if (from.pathname && !from.pathname.directory && from.parent) {
		// 			from = from.parent;
		// 		}
		// 		var startsWith = function(start,under) {
		// 			return under.toString().substring(0,start.toString().length) == start.toString();
		// 		};
		// 		var common = from;
		// 		var up = 0;
		// 		while(!startsWith(common,to)) {
		// 			var basename = common.pathname.basename;
		// 			up++;
		// 			common = common.parent;
		// 		}
		// 		var remaining = to.toString().substring(common.toString().length);
		// 		return new Array(up+1).join("../") + remaining;
		// 	}
		// }

		//	TODO	Searchpath implementation has multiple layers: in os.js, file.js, here ... consolidate and refactor
		$exports.Searchpath = Object.assign(function(parameters) {
			if (this.constructor != arguments.callee) {
				if (parameters instanceof Array) {
					return $exports.filesystem.Searchpath(parameters);
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
		$api.deprecate($exports.Searchpath,"createEmpty");
		$exports.Searchpath.prototype = prototypes.Searchpath;

		////	TODO	this implementation would be much simpler if we could use a normal loader/jrunscript loader with a _source, but
		////			right now this would cause Cygwin loaders to fail, probably
		//$context.$rhino.Loader.spi(function(underlying) {
		//	return function(p) {
		//		underlying.apply(this,arguments);
		//		if (arguments[0].directory) {
		//			var directory = arguments[0].directory;
		//			this.list = function(m) {
		//				return directory.list().map(function(node) {
		//					if (node.directory) {
		//						return { path: node.pathname.basename, loader: new $context.$rhino.Loader({ directory: node }) };
		//					} else {
		//						return {
		//							path: node.pathname.basename,
		//							resource: new $context.api.io.Resource({
		//								type: p.type(node),
		//								read: {
		//									binary: function() {
		//										return node.read($context.api.io.Streams.binary);
		//									}
		//								}
		//							})
		//						};
		//					}
		//				});
		//			};
		//		}
		//	};
		//});

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
		};

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
				var osdir = $exports.filesystems.os.Pathname($context.$pwd);
				if ($exports.filesystem == $exports.filesystems.cygwin) {
					osdir = $exports.filesystems.cygwin.toUnix(osdir);
				}
				return osdir.directory;
			}
		};
		$exports.__defineGetter__("workingDirectory", workingDirectory);
		//	Property only makes sense in context of an execution environment, so moving to jsh.shell (other environments can provide their
		//	own mechanisms)
		$api.deprecate($exports,"workingDirectory");

		$exports.Streams = $context.api.io.Streams;
		$api.deprecate($exports,"Streams");
		$exports.java = $context.api.io.java;
		$api.deprecate($exports,"java");
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$exports)
