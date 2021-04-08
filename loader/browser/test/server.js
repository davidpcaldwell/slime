//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { (value: slime.runtime.browser.test.server.Export) => void } $export
	 */
	function($api,jsh,$loader,$export) {
		$export(
			function(resources,serve,resultsPath) {
				var tomcat = new jsh.httpd.Tomcat();
				tomcat.map({
					//	TODO	make the below the default for goodness' sake if it is not already
					path: "",
					resources: new jsh.file.Loader({
						directory: resources
					}),
					servlets: {
						"/*": {
							load: function(scope) {
								//	This disables reloading for unit tests; should find a better way to do this rather than just ripping out the method
								delete scope.httpd.$reload;

								jsh.shell.console("Serving " + serve);

								scope.$exports.handle = scope.httpd.Handler.series(
									function(request) {
										jsh.shell.console("REQUEST: " + request.method + " " + request.path);
										return void(0);
									},
									(
										(jsh.typescript)
											? (function() {
												var filesystemLoader = new jsh.file.Loader({
													directory: serve
												});

												return function handleTypescript(request) {
													if (/\.ts$/.test(request.path)) {
														var resource = filesystemLoader.get(request.path);
														if (resource) {
															var compiled = jsh.typescript.compile(resource.read(String));
															return {
																status: { code: 200 },
																body: {
																	type: "application/javascript",
																	string: compiled
																}
															}
														}
													}
												}
											})()
											: $api.Function.returning(void(0))
									),
									(
										(resultsPath)
											? (function createResultHandler() {
												/** @type { slime.loader.Product<slime.runtime.browser.test.results.Context,slime.runtime.browser.test.results.Factory> } */
												var resultServletFactory = $loader.factory("handler-results.js");

												var resultServletFile = resultServletFactory({
													library: {
														java: jsh.java,
														shell: jsh.shell
													}
												});

												return resultServletFile({
													url: resultsPath
												})
											})()
											: $api.Function.returning(void(0))
									),
									new scope.httpd.Handler.Loader({
										loader: new jsh.file.Loader({
											directory: serve
										})
									})
								)
							}
						}
					}
				});
				tomcat.start();
				return tomcat;
			}
		)
	}
//@ts-ignore
)($api,jsh,$loader,$export);
