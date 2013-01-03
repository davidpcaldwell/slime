//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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

		this.map = function(prefix,pathname) {
			mapping.push({ pathname: pathname, prefix: prefix });
		}

		this.loader = new jsh.io.Loader({
			resources: new function() {
				this.getResourceAsStream = function(path) {
					for (var i=0; i<mapping.length; i++) {
						var prefix = mapping[i].prefix;
						if (path.substring(0,prefix.length) == prefix) {
							var subpath = path.substring(prefix.length);
							if (!mapping[i].pathname.directory) {
								throw new Error("Directory not found at " + mapping[i].pathname);
							}
							var file = mapping[i].pathname.directory.getFile(subpath);
							return (file) ? file.read(jsh.io.Streams.binary) : null;
						}
					}
					return null;
				}
			}
		});

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

			mapping.forEach(function(item) {
				build(item.prefix,item.pathname);
			});
		}
	}
	jsh.httpd.Resources.script = function(mappingFile) {
		var rv = new jsh.httpd.Resources();

		jsh.loader.run(mappingFile.pathname, {
			$mapping: mappingFile,
			map: function(prefix,pathname) {
				rv.map(prefix,pathname);
			}
		});

		return rv;
	};
};