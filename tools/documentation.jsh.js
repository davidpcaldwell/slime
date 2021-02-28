//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		$api.Function.result(
			{ options: {}, arguments: jsh.script.arguments.slice() },
			jsh.wf.cli.$f.option.pathname({ longname: "base" }),
			jsh.wf.cli.$f.option.string({ longname: "chrome:id" }),
			jsh.wf.cli.$f.option.string({ longname: "host" }),
			jsh.wf.cli.$f.option.string({ longname: "index" }),
			jsh.wf.cli.$f.option.boolean({ longname: "watch"}),
			function(p) {
				jsh.shell.tools.tomcat.require();

				/** @type { slime.jrunscript.file.Directory } */
				var base = (p.options.base) ? p.options.base.directory : jsh.shell.PWD;

				var chromeId = p.options["chrome:id"] || "documentation";
				var host = p.options.host || "documentation";
				var index = p.options.index || "README.html";

				var server = new jsh.httpd.Tomcat();
				server.map({
					path: "",
					servlets: {
						"/*": {
							load: function(scope) {
								scope.$exports.handle = scope.httpd.Handler.series(
									function(request) {
										var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/src\/(.*)/;
										var match = typedocPattern.exec(request.path);
										if (match) {
											var src = (match[1]) ? base.getSubdirectory(match[1]) : base;
											return new scope.httpd.Handler.Loader({
												loader: new jsh.file.Loader({ directory: src }),
												index: "index.html"
											})($api.Object.compose(request, { path: match[2] }))
										}
									},
									function(request) {
										var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/((.*)\.html$)/;
										var match = typedocPattern.exec(request.path);
										if (match) {
											var src = (match[1]) ? base.getSubdirectory(match[1]) : base;
											var output = src.getRelativePath("local/doc/typedoc");
											if (!output.directory || p.options.watch) {
												jsh.wf.typescript.typedoc({
													project: src
												});
											}
											jsh.shell.console("Serving: " + request.path);
											return new scope.httpd.Handler.Loader({
												loader: new jsh.file.Loader({ directory: src.getSubdirectory("local/doc/typedoc") }),
												index: "index.html"
											})($api.Object.compose(request, { path: match[2] }))
										}
									},
									new scope.httpd.Handler.Loader({
										loader: new jsh.file.Loader({ directory: base })
									})
								)
							}
						}
					}
				});
				server.start();

				//	Use dedicated Chrome browser if present
				if (jsh.shell.browser.chrome) {
					var pac = jsh.shell.jsh.src.getFile("rhino/ui/application-hostToPort.pac").read(String)
						.replace(/__HOST__/g, host)
						.replace(/__PORT__/g, String(server.port))
					;
					var instance = new jsh.shell.browser.chrome.Instance({
						location: base.getRelativePath("local/chrome/" + chromeId),
						proxy: new jsh.shell.browser.ProxyConfiguration({
							code: pac
						})
					});
					instance.run({
						uri: "http://" + host + "/" + index
					});
				} else {
					//	Otherwise, fall back to Java desktop integration and default browser
					Packages.java.awt.Desktop.getDesktop().browse( new Packages.java.net.URI( "http://127.0.0.1:" + server.port + "/" + index ) );
				}
				server.run();
			}
		)
	}
//@ts-ignore
)(Packages,$api,jsh)
