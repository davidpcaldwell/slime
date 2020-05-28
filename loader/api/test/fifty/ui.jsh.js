//@ts-check
(
	function() {
		var base = jsh.script.file.parent.parent.parent.parent.parent;
		jsh.shell.console(base.toString());
		var server = new jsh.httpd.Tomcat();
		var loader = new jsh.file.Loader({ directory: base });
		var $loader = jsh.script.loader;
		server.map({
			path: "/",
			resources: loader,
			servlets: {
				"/*": {
					load: function(scope) {
						scope.$exports.handle = function(request) {
							if (request.path == "") {
								return {
									status: { code: 200 },
									body: $loader.get("ui.html")
								}
							}
						}
					}
				}
			}
		});
		jsh.shell.console("Starting ...");
		server.start();
		jsh.shell.console("Opening browser ...");
		var browser = new jsh.shell.browser.chrome.Instance({ location: base.getRelativePath("local/fifty" )});
		//	TODO	use proxy configuration to do host name
		browser.run({ uri: "http://127.0.0.1:" + server.port + "/" });
		server.run();
	}
)()