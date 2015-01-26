//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	A resource mapping consists of a way to map file system locations to resource paths for a servlet.
//
//	This mapping can be shared between jsh plugin implementation of a servlet, where it can be used via the jsh.httpd.Resources
//	constructor below, and the build process, specified by tools/webapp.jsh.js
//

$exports.addJshPluginTo = function(jsh) {
	var Mapping = function(p) {
		if (p.directory) {
			p.loader = new jsh.io.Loader({ directory: p.directory });
		}
		this.toString = function() {
			return p.prefix + " -> " + p.loader;
		}

		this.get = function(path) {
			if (path.substring(0,p.prefix.length) == p.prefix) {
				var subpath = path.substring(p.prefix.length);
				return p.loader.resource(subpath);
			}
			return null;
		};

		this.getScript = function(path) {
			if (path.substring(0,p.prefix.length) == p.prefix) {
				var subpath = path.substring(p.prefix.length);
				return p.loader.spi.getScript(subpath);
			}
			return null;
		}

		this.list = function(path) {
			if (path.substring(0,p.prefix.length) == p.prefix) {
				var subpath = path.substring(p.prefix.length);
				var loader = (subpath.length) ? new p.loader.Child(subpath) : p.loader;
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
//				var node = (function() {
//					if (pathname.file) return pathname.file;
//					if (pathname.directory) return pathname.directory;
//					throw new Error("Not directory or file: " + pathname);
//				})();

				var copy = function(loader,pathname) {
					var recurse = arguments.callee;
					var directory = pathname.createDirectory({
						ifExists: function(dir) {
							return false;
						},
						recursive: true
					});
					var items = loader.list();
//					throw new Error();
					items.forEach(function(item) {
						if (item.loader) {
							recurse(item.loader, directory.getRelativePath(item.path));
						} else {
							directory.getRelativePath(item.path).write(item.resource.read(jsh.io.Streams.binary), {
								append: false
							});
						}
					});
//					if (node.loader) {
//						var to = pathname.createDirectory({
//							ifExists: function(dir) {
//								return false;
//							},
//							recursive: true
//						});
//						throw new Error();
//						var nodes = loader.list();
//						nodes.forEach(function(item) {
//							jsh.shell.echo("Copying " + item + " to " + to.getRelativePath(item.pathname.basename));
//							recurse(item,to.getRelativePath(item.pathname.basename));
//						});
//					} else {
//						throw new Error();
//						node.copy(pathname, {
//							filter: function(item) {
//								return true;
//							}
//						});
//					}
				}

				copy(loader,to);
			}

			build(p.prefix,p.loader);
		}
	};

	var OldMapping = function(p) {
		if (!p.pathname.directory) {
			throw new Error("Unimplemented: pathname is not directory, semantics not defined.");
		}

		Mapping.call(this,p);

		this.toString = function() {
			return p.prefix + " -> " + p.pathname;
		};

		this.get = function(path) {
			if (path.substring(0,p.prefix.length) == p.prefix) {
				var subpath = path.substring(p.prefix.length);
					if (p.implementation) return p.implementation.get(subpath);
				if (!p.pathname.directory) {
					return null;
				}
				var file = p.pathname.directory.getFile(subpath);
				return (file) ? new jsh.io.Resource({
					type: $context.getMimeType(file),
					read: {
						binary: function() {
							return file.read(jsh.io.Streams.binary)
						}
					}
				}) : null;
			}
			return null;
		};

		this.list = function(path) {
			if (path.substring(0,p.prefix.length) == p.prefix) {
				var subpath = path.substring(p.prefix.length);
					if (p.implementation) return p.implementation.list(subpath);
				if (!p.pathname.directory) {
					throw new Error("Unimplemented.");
				}
				var directory = (subpath.length) ? p.pathname.directory.getSubdirectory(subpath) : p.pathname.directory;
				return directory.list({ type: directory.list.ENTRY }).map(function(entry) {
					return entry.path.replace(/\\/g, "/");
				});
			}
			return null;
		}

		this.build = function(WEBAPP) {
				if (p.implementation) throw new Error("Unimplemented: convert build to use list");
			var build = function(prefix,pathname) {
				var to = WEBAPP.getRelativePath(prefix);
				var node = (function() {
					if (pathname.file) return pathname.file;
					if (pathname.directory) return pathname.directory;
					throw new Error("Not directory or file: " + pathname);
				})();

				var copy = function(node,pathname) {
					var recurse = arguments.callee;
					if (node.directory) {
						var to = pathname.createDirectory({
							ifExists: function(dir) {
								return false;
							},
							recursive: true
						});
						var nodes = node.list();
						nodes.forEach(function(item) {
							jsh.shell.echo("Copying " + item + " to " + to.getRelativePath(item.pathname.basename));
							recurse(item,to.getRelativePath(item.pathname.basename));
						});
					} else {
						node.copy(pathname, {
							filter: function(item) {
								return true;
							}
						});
					}
				}

				copy(node,to);
			}

			build(p.prefix,p.pathname);
		}
	}

	var Resources = function(mapping,old) {
		var loader = new function() {
			this.get = function(path) {
				for (var i=0; i<mapping.length; i++) {
					var mapped = mapping[i].get(path);
					if (mapped) return mapped;
				}
				return null;
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
							rv.push(under);
						}
					}
				}
				return rv;
			};

			this.toString = function() {
				return "jsh.httpd.Resources [" + mapping.map(function(item) {
					return item.toString();
				}).join(", ") + "]";
			}
		};

		var OldLoader = function(prefix) {
			var rv = new jsh.io.Loader({
				resources: new function() {
					this.get = function(path) {
						return loader.get(prefix+path);
					};
				},
				Loader: function(subprefix) {
					var rv = new OldLoader(prefix + subprefix);
					rv.list = function(p) {
						return loader.list(prefix + subprefix + p.path);
					}
					return rv;
				}
			});
			rv.toString = function() {
				return "resources.jsh.file.js loader: prefix=" + prefix;
			}
			rv.list = function(p) {
				return loader.list(prefix+p.path);
			};
			return rv;
		};

		var NewLoader = function() {
			var p = new function() {
				this.getScript = function(path) {
					for (var i=0; i<mapping.length; i++) {
						var mapped = mapping[i].get(path);
						if (mapped) {
							return mapping[i].getScript(path);
						}
					}
					return null;
				};

				this._stream = function(path) {
					for (var i=0; i<mapping.length; i++) {
						var mapped = mapping[i].get(path);
						if (mapped) {
							return mapped.read.binary().java.adapt();
						}
					}
					return null;
				}

				this.Loader = function(prefix) {
					this.list = function() {
						return loader.list(prefix);
					};
				}
			}
			return new jsh.io.Loader(p);
		}

		this.loader = (old) ? new OldLoader("") : new NewLoader();

		this.file = function(mappingFile,scope) {
			if (!mappingFile) throw new TypeError("mappingFile must be defined.");
			if (!scope) scope = {};
			var rv = this;
			if (mappingFile.loader) {
				mappingFile.loader.run(mappingFile.path, jsh.js.Object.set({}, {
					$mapping: (mappingFile.pathname) ? mappingFile : void(0),
					map: function(prefix,pathname) {
						rv.map(prefix,pathname);
					}
				}, scope));
			} else {
				var toRun = (mappingFile.name && mappingFile.code) ? mappingFile : {
					name: mappingFile.pathname.basename,
					code: mappingFile.read(String)
				};
				jsh.loader.run(toRun, jsh.js.Object.set({}, {
					$mapping: (mappingFile.pathname) ? mappingFile : void(0),
					map: function(prefix,pathname) {
						rv.map(prefix,pathname);
					}
				}, scope));
			}
		}

		this.build = function(WEBAPP) {
			mapping.forEach(function(item) {
				item.build(WEBAPP);
//				build(item.prefix,item.pathname);
			});
		}
	}

	var OldResources = function() {
		var mapping = [];

		Resources.call(this,mapping,true);

		//	Below implementation plugs into an attempt at variability for OldMapping; probably obsolete
//		this.map = function(prefix,pathname) {
//			if (pathname.get && pathname.list) {
//				mapping.push(new Mapping({ implementation: pathname, prefix: prefix }));
//			} else {
//				mapping.push(new Mapping({ pathname: pathname, prefix: prefix }));
//			}
//		};

		this.map = function(prefix,pathname) {
			mapping.push(new OldMapping({ pathname: pathname, prefix: prefix }));
		};

		this.Loader = function(p) {
			var rv = new jsh.file.Loader(p);
			rv.list = function(m) {
				var directory = p.directory;
				var dir = (m.path) ? directory.getSubdirectory(m.path) : directory;
				return dir.list({ type: dir.list.ENTRY }).map(function(entry) {
					return entry.path;
				});
			}
			return rv;
		};
	};

	var NewResources = function() {
		var mapping = [];

		Resources.call(this,mapping);

		this.add = function(m) {
			//	prefix, loader properties
			mapping.push(new Mapping(m));
		}

		this.map = function(prefix,pathname) {
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

		//	TODO	the below method is odd. What does it do?
		this.Loader = function(p) {
			return new jsh.io.Loader(p);
		}
	};

	jsh.httpd.Resources = function() {
		return new NewResources();
	};
	jsh.httpd.Resources.Old = $api.deprecate(OldResources);

	var script = function(rv,args) {
		for (var i=0; i<args.length; i++) {
			var mappingFile = args[i];
			rv.file(mappingFile);
		}
		return rv;
	}

	jsh.httpd.Resources.script = function(/* mapping files */) {
		var resources = new NewResources();
		//	TODO	remove the next line
//		resources = new OldResources();
		return script(resources, Array.prototype.slice.call(arguments));
	};

	jsh.httpd.Resources.script.Directory = function(loader) {
		this.getRelativePath = function(path) {
			if (!loader.Child) throw new Error("no loader.Child");
			return {
				loader: new loader.Child(path)
			};
		}
	};

	jsh.httpd.Resources.script.old = function(/* mapping files */) {
		return script(new OldResources(), Array.prototype.slice.call(arguments));
	};
};