//@ts-check
(
	function() {
		var slime = {
			directory: jsh.script.file.parent.parent.parent.parent.parent.parent
		};
		slime.loader = new jsh.file.Loader({ directory: slime.directory });
		var server = new jsh.httpd.Tomcat();
		var $loader = jsh.script.loader;
		server.map({
			path: "/",
			resources: slime.loader,
			servlets: {
				"/*": {
					load: function(scope) {
						scope.$exports.handle = scope.httpd.Handler.series(
							function(request) {
								if (request.path == "") return scope.httpd.http.Response.resource($loader.get("index.html"));
							},
							function(request) {
								if (request.path == "tsc.json") {
									return $api.Function.memoized(function() {
										return jsh.shell.run({
											command: slime.directory.getFile("loader/api/test/fifty/tsc.bash"),
											arguments: [ slime.directory.getFile("loader/api/test/fifty/test/data/module.d.ts") ],
											environment: $api.Object.compose(
												jsh.shell.environment,
												{
													PROJECT: slime.directory
													//,
													//NODE_DEBUG: "--inspect-brk"
												}
											),
											stdio: {
												output: String,
												error: String
											},
											evaluate: function(result) {
												return {
													status: { code: 200 },
													body: {
														type: "application/json",
														string: result.stdio.output
													}
												}
											}
										})
									})();
								}
							},
							scope.httpd.Handler.Child({
								filter: /^code\/slime\/(.*)/,
								handle: function(request) {
									var resource = slime.loader.get(request.path);
									return (resource) ? scope.httpd.http.Response.resource(resource) : {
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
		var browser = new jsh.shell.browser.chrome.Instance({ location: slime.directory.getRelativePath("local/fifty/chrome" )});
		browser.run({ uri: "http://127.0.0.1:" + server.port + "/" });
		server.run();
	}
)()