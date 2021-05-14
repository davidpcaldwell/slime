//@ts-check
(
	/**
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var server = new jsh.httpd.Tomcat();
		server.servlet({
			load: function(scope) {
				scope.$exports.handle = function(request) {
					if (request.path == "module.js") {
						return {
							status: { code: 200 },
							body: {
								type: "application/javascript",
								string: jsh.script.file.parent.getFile("module.js").read(String)
							}
						}
					}
				}
			}
		});
		server.start();
		jsh.shell.echo(
			JSON.stringify({
				pathname: jsh.loader.module(jsh.script.file.parent.getRelativePath("module.js")),
				missing: jsh.loader.module(jsh.script.file.parent.getRelativePath("foo.js")),
				relative: jsh.loader.module("module.js"),
				absolute: jsh.loader.module(jsh.script.file.parent.getRelativePath("module.js").toString()),
				http: {
					base: jsh.loader.module( "http://127.0.0.1:" + server.port + "/" ),
					file: jsh.loader.module( "http://127.0.0.1:" + server.port + "/module.js" )
				},
				url: {
					base: jsh.loader.module( jsh.js.web.Url.parse("http://127.0.0.1:" + server.port + "/") ),
					file: jsh.loader.module( jsh.js.web.Url.parse("http://127.0.0.1:" + server.port + "/module.js") )
				}
			}, void(0), 4)
		)
	}
//@ts-ignore
)(jsh);
