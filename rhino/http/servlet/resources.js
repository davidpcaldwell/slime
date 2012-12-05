//	A resource mapping consists of a way to map file system locations to resource paths for a servlet.
//
//	This mapping can be shared between jsh plugin implementation of a servlet, where it can be used via the jsh.httpd.Resources
//	constructor below, and the build process, specified by tools/webapp.jsh.js
//

$exports.addJshPluginTo = function(jsh) {
	jsh.httpd.Resources = function(mappingFile) {
		var mapping = [];

		jsh.loader.run(mappingFile.pathname, {
			$mapping: mappingFile,
			map: function(prefix,pathname) {
				mapping.push({ pathname: pathname, prefix: prefix });
			}
		});

		return new jsh.io.Loader({
			resources: new function() {
				this.getResourceAsStream = function(path) {
					debugger;
					for (var i=0; i<mapping.length; i++) {
						var prefix = mapping[i].prefix;
						if (path.substring(0,prefix.length) == prefix) {
							var subpath = path.substring(prefix.length);
							var file = mapping[i].pathname.directory.getFile(subpath);
							return (file) ? file.read(jsh.io.Streams.binary) : null;
						}
					}
					return null;
				}
			}
		});
	};
};