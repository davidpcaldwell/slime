//@ts-check
(
	function() {
		var base = jsh.script.file.parent.parent.parent.parent.parent;
		var server = new jsh.httpd.Tomcat();
		var loader = new jsh.file.Loader({ directory: base });
		var $loader = jsh.script.loader;
		server.map({
			path: "/",
			resources: loader,
			servlets: {
				"/*": {
					load: function(scope) {
						scope.$exports.handle = scope.httpd.Handler.series(
							function(request) {
								if (request.path == "") {
									return {
										status: { code: 200 },
										body: $loader.get("ui.html")
									}
								}
							},
							scope.httpd.Handler.Child({
								filter: /^code\/slime\/(.*)/,
								handle: function(request) {
									var resource = loader.get(request.path);
									return (resource) ? {
										status: { code: 200 },
										body: resource
									} : {
										status: { code: 404 }
									}
								}
							})
						);
					}
				}
			}
		});
		server.start();
		var browser = new jsh.shell.browser.chrome.Instance({ location: base.getRelativePath("local/fifty" )});
		browser.run({ uri: "http://127.0.0.1:" + server.port + "/" });
		server.run();
	}
)()