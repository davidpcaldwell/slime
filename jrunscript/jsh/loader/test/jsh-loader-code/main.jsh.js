//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var server = jsh.httpd.Tomcat();
		server.servlet({
			load: function(scope) {
				scope.$exports.handle = function(request) {
					var file = jsh.script.file.parent.getFile(request.path);
					if (file) {
						return {
							status: { code: 200 },
							body: {
								type: "application/javascript",
								string: file.read(String)
							}
						}
					} else {
						return {
							status: { code: 404 }
						}
					}
				}
			}
		});
		server.start();
		var directory = jsh.script.file.parent;
		jsh.shell.echo(
			JSON.stringify({
				module: {
					pathname: jsh.loader.module(jsh.script.file.parent.getRelativePath("module.js")),
					missing: jsh.loader.module(jsh.script.file.parent.getRelativePath("foo.js")),
					relative: jsh.loader.module("module.js"),
					absolute: jsh.loader.module(jsh.script.file.parent.getRelativePath("module.js").toString()),
					http: {
						base: jsh.loader.module( "http://127.0.0.1:" + server.port + "/" ),
						file: jsh.loader.module( "http://127.0.0.1:" + server.port + "/module.js" )
					},
					url: {
						base: jsh.loader.module( jsh.web.Url.parse("http://127.0.0.1:" + server.port + "/") ),
						file: jsh.loader.module( jsh.web.Url.parse("http://127.0.0.1:" + server.port + "/module.js") )
					}
				},
				file: {
					pathname: jsh.loader.file(directory.getRelativePath("file.js")),
					missing: (function() {
						var file = directory.getRelativePath("foo.js");
						if (!file.file) return null;
						return jsh.loader.file(file);
					})(),
					relative: jsh.loader.file("file.js"),
					absolute: jsh.loader.file(directory.getRelativePath("file.js").toString()),
					http: jsh.loader.file("http://127.0.0.1:" + server.port + "/file.js"),
					url: jsh.loader.file( jsh.web.Url.parse("http://127.0.0.1:" + server.port + "/file.js") )
				}
			}, void(0), 4)
		);
		server.stop();
	}
//@ts-ignore
)(jsh);
