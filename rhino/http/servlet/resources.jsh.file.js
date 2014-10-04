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
	jsh.httpd.Resources = function() {
		var mapping = [];

		var Mapping = function(p) {
			if (!p.pathname.directory) {
				throw new Error("Unimplemented: pathname is not directory, semantics not defined.");
			}
			this.get = function(path) {
				if (path.substring(0,p.prefix.length) == p.prefix) {
					var subpath = path.substring(p.prefix.length);
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

			this.under = function(path) {
				if (p.prefix.substring(0,path.length) == path) {
					var remaining = p.prefix.substring(path.length);
					var add = remaining.split("/")[0] + "/";
					return add;
				}
			};

			this.build = function(WEBAPP) {
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

		this.map = function(prefix,pathname) {
			mapping.push(new Mapping({ pathname: pathname, prefix: prefix }));
		};

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
					return item.prefix + "->" + item.pathname;
				}).join(", ") + "]";
			}
		};

		var Loader = function(prefix) {
			var rv = new jsh.io.Loader({
				resources: new function() {
					this.get = function(path) {
						return loader.get(prefix+path);
					};
				},
				Loader: function(subprefix) {
					var rv = new Loader(prefix + subprefix);
					return rv;
				}
			});
			rv.toString = function() {
				return "resources.jsh.file.js loader: prefix=" + prefix;
			}
			rv.list = function(p) {
				return loader.list(prefix+p.path);
			}
			return rv;
		}

		this.loader = new Loader("");

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
		}

		this.build = function(WEBAPP) {
			mapping.forEach(function(item) {
				item.build(WEBAPP);
//				build(item.prefix,item.pathname);
			});
		}
	}
	jsh.httpd.Resources.script = function(/* mapping files */) {
		var rv = new jsh.httpd.Resources();

		for (var i=0; i<arguments.length; i++) {
			var mappingFile = arguments[i];
			jsh.loader.run(mappingFile.pathname, {
				$mapping: mappingFile,
				map: function(prefix,pathname) {
					rv.map(prefix,pathname);
				}
			});
		}

		return rv;
	};
};