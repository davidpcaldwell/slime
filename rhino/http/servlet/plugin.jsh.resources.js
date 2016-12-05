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
			return p.loader.get(subpath);
		}
		return null;
	};

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
						directory.getRelativePath(item.path).write(item.resource.read(jsh.io.Streams.binary), {
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

var OldMapping = function(p) {
	if (!p.pathname.directory) {
		throw new Error("Unimplemented: pathname " + p.pathname + " is not directory, semantics not defined.");
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
				length: file.resource.length,
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
		if (Packages.java.lang.System.getenv("SLIME_LOADER_RHINO_REMOVE_DEPRECATED")) {
			var implementation = new jsh.io.Loader({
				get: function(path) {
					return loader.get(path);
				}
			});
			var rv = new implementation.Child(prefix);
			rv.list = function(p) {
				return loader.list.call(loader,prefix+p.path);
			};
			return rv;
		} else {
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
				return "plugin.jsh.resources.js OldLoader: prefix=" + prefix + " loader=" + loader;
			}
			rv.list = function(p) {
				return loader.list(prefix+p.path);
			};
			return rv;
		}
	};

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

		p.list = function() {
			return loader.list(p.prefix);
		}

		p.child = function(path) {
			return { prefix: p.prefix+path };
		}
		jsh.io.Loader.apply(this,[p]);
		this.resource = function(path) {
			return this.source.get(path);
		};
		//	TODO	why is list necessary for children but apparently not for parent? assuming it was a bug; adding
		this.toString = function() {
			return "plugin.jsh.resources.js NewLoader: [" + mapping.map(function(map) {
				return String(map);
			}).join("\n");
		}
//			this.list = function() {
//				return loader.list("");
//			}
	}

	this.loader = (old) ? new OldLoader("") : new NewLoader();

	this.file = function(mappingFile,scope) {
		if (!mappingFile) throw new TypeError("mappingFile must be defined.");
		if (!scope) scope = {};
		var rv = this;
		var api = jsh.js.Object.set({}, {
			$mapping: (mappingFile.pathname) ? mappingFile : void(0),
			map: function(prefix,pathname) {
				rv.map(prefix,pathname);
			}
		}, (rv.add) ? { add: function(m) { rv.add(m); } } : {}, scope);
		if (mappingFile.loader) {
			mappingFile.loader.run(mappingFile.path, api);
		} else {
			var toRun = (mappingFile.name && mappingFile.string) ? mappingFile : {
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

var OldResources = function() {
	var mapping = [];

	Resources.call(this,mapping,true);

	this.map = function(prefix,pathname) {
		mapping.push(new OldMapping({ pathname: pathname, prefix: prefix }));
	};

//		this.Loader = function(p) {
//			var rv = new jsh.file.Loader(p);
//			rv.list = function(m) {
//				var directory = p.directory;
//				var dir = (m.path) ? directory.getSubdirectory(m.path) : directory;
//				return dir.list({ type: dir.list.ENTRY }).map(function(entry) {
//					return entry.path;
//				});
//			}
//			return rv;
//		};
};

var NewResources = function() {
	var mapping = [];

	Resources.call(this,mapping);

	this.add = function(m) {
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
};

jsh.httpd.Resources = function() {
	return new NewResources();
};
jsh.httpd.Resources.Old = $api.deprecate(OldResources);

jsh.httpd.Resources.NoVcsDirectory = DirectoryWithoutVcsLoader;

var script = function(rv,args) {
	for (var i=0; i<args.length; i++) {
		var mappingFile = args[i];
		rv.file(mappingFile);
	}
	return rv;
}

jsh.httpd.Resources.script = function(/* mapping files */) {
	var resources = new NewResources();
	return script(resources, Array.prototype.slice.call(arguments));
};

jsh.httpd.Resources.script.Directory = function(loader) {
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

jsh.httpd.Resources.script.old = function(/* mapping files */) {
	return script(new OldResources(), Array.prototype.slice.call(arguments));
};
