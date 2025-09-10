//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($api,jsh,$slime,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.$fifty);
			},
			load: function() {
				var typescript = {
					compile: function(code) {
						var maybe = $slime.compiler.compile({
							name: "<jsh.typescript code>",
							type: function() {
								return {
									media: "application",
									subtype: "x.typescript",
									parameters: {}
								}
							},
							read: function() {
								return code;
							}
						});
						if (!maybe.present) throw new Error("Unable to compile TypeScript.");
						return maybe.value.js;
					}
				};

				//	TODO	rename 'httpd' to 'Global'
				/**
				 * @param { slime.servlet.httpd } httpd
				 * @param { slime.jrunscript.file.Location } serve
				 * @param { string } resultPath
				 * @returns { slime.servlet.handler }
				 */
				var handler = function(httpd,serve,resultPath) {
					var content = jsh.file.Location.directory.content.Index(serve);

					/** @type { slime.servlet.Handler } */
					var contentHandler = httpd.Handler.content({
						store: content,
						map: function(location) {
							var length = $api.fp.now(
								jsh.file.Location.file.size,
								$api.fp.world.Sensor.mapping()
							);
							/** @type { slime.servlet.response.Properties } */
							var properties = $api.fp.now(
								location,
								$api.fp.Mapping.properties({
									modified: $api.fp.pipe(jsh.file.Location.lastModified.simple, function(tv) { return new Date(tv); }),
									length: length,
									type: $api.fp.pipe( jsh.file.Location.basename, $api.mime.Type.fromName )
								})
							);
							var open = $api.fp.now(
								jsh.file.Location.file.read.stream(),
								$api.fp.world.Sensor.mapping(),
								$api.fp.Partial.impure.exception(function(location) { return new Error("File not found: " + location.pathname )})
							);
							return {
								body: {
									modified: properties.modified,
									length: properties.length,
									type: properties.type,
									stream: open(location)
								}
							}
						}
					});

					/** @type { slime.servlet.Handler } */
					var resultsHandler = (function createResultHandler() {
						if (!resultPath) return $api.fp.Partial.from.loose(function(request) { return void(0); })
						/** @type { slime.loader.Script<slime.runtime.browser.test.results.Context,slime.runtime.browser.test.results.Factory> } */
						var resultServletFactory = $loader.script("handler-results.js");

						var resultServletFile = resultServletFactory({
							library: {
								java: jsh.java,
								shell: jsh.shell
							}
						});

						return $api.fp.Partial.from.loose(resultServletFile({
							url: resultPath
						}));
					})()

					/** @type { slime.servlet.Handler } */
					var typescriptHandler = (function() {
						var filesystemLoader = new jsh.file.Loader({
							directory: jsh.file.Pathname(serve.pathname).directory
						});

						var loose = function handleTypescript(request) {
							if (/\.ts$/.test(request.path)) {
								var resource = filesystemLoader.get(request.path);
								if (resource) {
									var compiled = typescript.compile(resource.read(String));
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

						return $api.fp.Partial.from.loose(loose);
					})();

					return $api.fp.pipe(
						/** @type { slime.$api.fp.Identity<slime.servlet.Request> } */($api.fp.identity),
						$api.fp.impure.tap(function(request) {
							jsh.shell.console("REQUEST: " + request.method + " " + request.path);
						}),
						$api.fp.now(
							$api.fp.switch([
								typescriptHandler,
								resultsHandler,
								contentHandler
							]),
							$api.fp.Partial.else(function(request) {
								return {
									status: {
										code: 404
									}
								}
							})
						)
					);
				};

				/**
				 *
				 * @param { slime.jrunscript.file.Directory } serve
				 * @param { string } resultsPath
				 * @returns { slime.jsh.httpd.servlet.DescriptorUsingLoad["load"] }
				 */
				var load = function(serve,resultsPath) {
					if (!serve) debugger;
					return function(scope) {
						//	This disables reloading for unit tests; should find a better way to do this rather than just ripping out the method
						delete scope.httpd.$reload;

						jsh.shell.console("Serving " + serve);

						scope.$exports.handle = handler(scope.httpd, serve.pathname.os.adapt(), resultsPath);
					}
				};

				/**
				 * @deprecated Replaced by duplicative method `load` above
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
											(typescript)
												? (function() {
													var filesystemLoader = new jsh.file.Loader({
														directory: serve
													});

													return function handleTypescript(request) {
														if (/\.ts$/.test(request.path)) {
															var resource = filesystemLoader.get(request.path);
															if (resource) {
																var compiled = typescript.compile(resource.read(String));
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

				jsh.$fifty.browser = {
					test: {
						server: {
							start: function(p) {
								configure(p.tomcat, p.resources, p.serve, p.resultsPath);
							},
							create: function(p) {
								var resources = p.resources;
								var serve = p.serve;
								var resultsPath = p.resultsPath;
								return jsh.httpd.tomcat.Server.from.configuration({
									resources: new jsh.file.Loader({
										directory: resources
									}),
									servlet: {
										load: load(serve, resultsPath)
									}
								})
							}
						}
					}
				};
			}
		})
	}
//@ts-ignore
)($api,jsh,$slime,$loader,plugin);
