//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.runtime.browser.test.server.Exports> } $export
	 */
	function($api,jsh,$loader,$export) {
		/**
		 *
		 * @param { slime.jsh.httpd.Tomcat } tomcat
		 * @param { slime.jrunscript.file.Directory } resources
		 * @param { slime.jrunscript.file.Directory } serve
		 * @param { string } resultsPath
		 */
		var configure = function(tomcat,resources,serve,resultsPath) {
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
										: $api.fp.returning(void(0))
								),
								(
									(resultsPath)
										? (function createResultHandler() {
											/** @type { slime.loader.Script<slime.runtime.browser.test.results.Context,slime.runtime.browser.test.results.Factory> } */
											var resultServletFactory = $loader.script("handler-results.js");

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
										: $api.fp.returning(void(0))
								),
								scope.httpd.Handler.Loader({
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
		};

		$export({
			start: function(p) {
				configure(p.tomcat, p.resources, p.serve, p.resultsPath);
			},
			create: function(resources,serve,resultsPath) {
				var tomcat = jsh.httpd.Tomcat();
				configure(tomcat, resources, serve, resultsPath);
				return tomcat;
			}
		})
	}
//@ts-ignore
)($api,jsh,$loader,$export);
