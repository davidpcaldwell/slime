//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	A resource mapping consists of a way to map file system locations to resource paths for a servlet.
//
//	This mapping can be shared between jsh plugin implementation of a servlet, where it can be used via the jsh.httpd.Resources
//	constructor below, and the build process, specified by tools/webapp.jsh.js
//

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.httpd.internal.resources.Context } $context
	 * @param { slime.loader.Export<slime.jsh.httpd.resources.Exports> } $export
	 */
	function($api,$context,$export) {
		var jsh = $context.jsh;

		var DirectoryWithoutVcsLoader = function(p) {
			var delegate = (p.directory) ? new jsh.file.Loader(p) : p.loader;
			var source = {
				get: function(name) {
					return delegate.source.get(name);
				},
				list: function() {
					return delegate.source.list().filter(function(item) {
						return item.path != ".hg";
					});
				},
				child: (p.directory) ? function(prefix) {
					return {
						directory: p.directory.getSubdirectory(prefix)
					};
				} : function(prefix) {
					return {
						loader: new p.loader.Child(prefix)
					}
				}
			};
			jsh.io.Loader.call(this,source);
		};

		/**
		 * @param { { directory?: slime.jrunscript.file.Directory, loader?: slime.old.Loader, prefix: string } } p
		 */
		var Mapping = function(p) {
			if (p.directory) {
				p.loader = new DirectoryWithoutVcsLoader({ directory: p.directory });
			}
			this.toString = function() {
				return p.prefix + " -> " + p.loader + " (dir=" + p.directory + ")";
			}

			this.get = function(path) {
				if (path.substring(0,p.prefix.length) == p.prefix) {
					var subpath = path.substring(p.prefix.length);
					return p.loader.source.get(subpath);
				}
				return null;
			};

			this.list = function(path) {
				if (path.substring(0,p.prefix.length) == p.prefix) {
					var subpath = path.substring(p.prefix.length);
					var loader = (subpath.length) ? p.loader.Child(subpath) : p.loader;
					return loader.list();
				}
				return null;
			};

			this.under = function(path) {
				if (p.prefix.substring(0,path.length) == path) {
					var remaining = p.prefix.substring(path.length);
					var add = remaining.split("/")[0] + "/";
					return add;
				}
			};

			this.build = function(WEBAPP) {
				var build = function(prefix,loader) {
					var to = WEBAPP.getRelativePath(prefix);

					var copy = function(loader,pathname) {
						var recurse = arguments.callee;
						var directory = pathname.createDirectory({
							ifExists: function(dir) {
								return false;
							},
							recursive: true
						});
						if (!loader.list) {
							debugger;
						}
						var items = loader.list();
						items.forEach(function(item) {
							if (item.loader) {
								recurse(item.loader, directory.getRelativePath(item.path));
							} else {
								// TODO: this used to be item.resource.read(jsh.io.Streams.binary); not sure which it should be right now.
								// seems to be mismatch between Resource and Resource.source
								var resource = item.resource;
								directory.getRelativePath(item.path).write(resource.read(jsh.io.Streams.binary), {
									append: false
								});
							}
						});
					}

					copy(loader,to);
				}

				build(p.prefix,p.loader);
			}
		};

		var Resources = function(mapping) {
			var loader = new function() {
				this.get = function(path) {
					for (var i=0; i<mapping.length; i++) {
						var mapped = mapping[i].get(path);
						if (mapped) return mapped;
					}
					return null;
				};

				var toEntry = function(item) {
					if (typeof(item) == "string") {
						if (item.substring(item.length-1) == "/") {
							return {
								path: item.substring(0,item.length-1),
								loader: true,
								resource: false
							}
						} else {
							return {
								path: item,
								loader: false,
								resource: true
							}
						}
					} else if (item.path) {
						return item;
					} else {
						throw new Error();
					}
				};

				this.list = function(path) {
					var rv = [];
					for (var i=0; i<mapping.length; i++) {
						var listed = mapping[i].list(path);
						var under = mapping[i].under(path);
						if (listed) {
							rv = rv.concat(listed);
						} else if (under) {
							if (rv.indexOf(under) == -1) {
								rv.push({ path: under.substring(0,under.length-1), loader: true  });
							}
						}
					}
					return rv.map(toEntry);
				};

				this.toString = function() {
					return "jsh.httpd.Resources [" + mapping.map(function(item) {
						return item.toString();
					}).join(", ") + "]";
				}
			};

			/**
			 * @param { { prefix?: string } & slime.old.loader.Source<{ prefix: string }> } [p]
			 * @this { slime.old.Loader<any, slime.Resource> & { resource: any } }
			 */
			var NewLoader = function(p) {
				if (!p) p = {};
				if (!p.prefix) p.prefix = "";
				var get = function(path) {
					for (var i=0; i<mapping.length; i++) {
						var gotten = mapping[i].get(path);
						if (gotten) return gotten;
					}
				};

				p.get = function(path) {
					var rv = get(p.prefix+path);
					return rv;
				};

				//	Satisfy TypeScript
				this.Child = this.Child;
				this.get = this.get;

				var self = this;

				p.list = function() {
					var prefix = (p.prefix) ? p.prefix : "";
					var rv = loader.list(prefix + arguments[0]);
					rv.forEach(function(listed) {
						if (listed.loader && listed.loader === true) {
							listed.loader = self.Child(listed.path + "/");
						}
					},this);
					return rv;
				}

				p.child = function(path) {
					return { prefix: p.prefix+path };
				}
				jsh.io.Loader.apply(this,[p]);
				this.resource = function(path) {
					return this.get(path);
				};
				//	TODO	why is list necessary for children but apparently not for parent? assuming it was a bug; adding
				this.toString = function() {
					return "plugin.jsh.resources.js NewLoader: prefix=" + p.prefix + " mapping=[" + mapping.map(function(map) {
						return String(map);
					}).join("\n");
				}
				// this.list = function() {
				// 	return loader.list("");
				// }
			}

			this.loader = new NewLoader();

			/**
			 * @type { slime.jsh.httpd.Resources["file"] }
			 */
			this.file = function(mappingFile,scope) {
				if (!mappingFile) throw new TypeError("mappingFile must be defined.");
				if (!scope) scope = {};

				/** @type { (argument: slime.jsh.httpd.resources.Mapping) => argument is slime.jrunscript.file.File } */
				var isFile = function(argument) {
					return Boolean(argument["pathname"]);
				}

				/** @type { (argument: slime.jsh.httpd.resources.Mapping) => argument is slime.jsh.httpd.resources.LoaderMapping } */
				var isLoaderMapping = function(argument) {
					return Boolean(argument["loader"]);
				}

				/** @type { (argument: slime.jsh.httpd.resources.Mapping) => argument is slime.jsh.httpd.resources.CodeMapping } */
				var isCodeMapping = function(argument) {
					return Boolean(argument["name"]) && Boolean(argument["string"]);
				}

				//	Satisfy TypeScript
				this.add = this.add;
				this.map = this.map;

				var rv = this;
				/** @type { slime.jsh.httpd.resources.Scope } */
				var api = $api.Object.compose({
					$mapping: (isFile(mappingFile)) ? mappingFile : void(0),
					map: function(prefix,pathname) {
						rv.map(prefix,pathname);
					}
				}, (rv.add) ? { add: function(m) { rv.add(m); } } : {}, scope);
				if (isLoaderMapping(mappingFile)) {
					mappingFile.loader.run(mappingFile.path, api);
				} else {
					var toRun = (isCodeMapping(mappingFile)) ? mappingFile : {
						name: mappingFile.pathname.basename,
						type: "application/javascript",
						string: mappingFile.read(String)
					};
					jsh.loader.run(toRun, api);
				}
			}

			this.build = function(WEBAPP) {
				mapping.forEach(function(item) {
					item.build(WEBAPP);
				});
			}
		}

		/**
		 * @type { new () => slime.jsh.httpd.Resources }
		 */
		var NewResources = function() {
			var mapping = [];

			this.file = void(0);
			this.loader = void(0);
			this.build = void(0);
			Resources.call(this,mapping);

			/** @type { slime.jsh.httpd.Resources["add"] } */
			this.add = function(m) {
				mapping.push(new Mapping(m));
			}

			this.map = function(prefix,pathname) {
				//	TODO	poor workaround on next line for attempt to map a directory rather than a correctly-structured object
				if (pathname.directory === true) pathname = pathname.pathname;
				if (pathname.directory) {
					mapping.push(new Mapping({
						prefix: prefix,
						directory: pathname.directory
					}));
				} else if (pathname.loader) {
					mapping.push(new Mapping({
						prefix: prefix,
						loader: pathname.loader
					}));
				}
			};
		};

		var rv = (function() {
			var rv = {
				Old: void(0),
				NoVcsDirectory: void(0),
				script: void(0),
				Constructor: NewResources
			};

			rv.NoVcsDirectory = DirectoryWithoutVcsLoader;

			return rv;
		})();

		var script = function(rv,args) {
			for (var i=0; i<args.length; i++) {
				var mappingFile = args[i];
				rv.file(mappingFile);
			}
			return rv;
		}

		rv.script = function(/* mapping files */) {
			var resources = new NewResources();
			return script(resources, Array.prototype.slice.call(arguments));
		};

		rv.script.Directory = function(loader) {
			this.pathname = {
				loader: loader
			};

			this.getRelativePath = function(path) {
				if (!loader.Child) throw new Error("no loader.Child");
				return {
					loader: new loader.Child(path)
				};
			}
		};

		$export(rv);
	}
//@ts-ignore
)($api,$context,$export)
