//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet {
	export interface Parameters {
		[x: string]: any
	}

	export interface httpd {
		context: {
			/**
			 * Provides a limited interface to the "standard I/O" streams of the server. These conceptually map to the
			 * `stdout` and `stderr` streams of the server process, but may be altered by embedders.
			 */
			stdio: {
				output: (line: string) => void
				error: (line: string) => void
			}
		}

		loader: slime.old.Loader

		/**
		 * @deprecated
		 */
		js: any

		java: slime.jrunscript.java.Exports
		io: slime.jrunscript.io.Exports
		web: slime.web.Exports

		$slime: slime.jrunscript.runtime.Exports
		/** @deprecated Use `$slime`. */
		$java: slime.jrunscript.runtime.Exports

		$reload?: () => void
	}

	/**
	 * A function that can handle requests.
	 *
	 * @param request A request.
	 * @returns A response.
	 */
	export type handler = (request: Request) => Response

	export interface Script {
		handle: handler
		destroy?: () => void
	}

	/**
	 * Various objects and APIs that allow a servlet to interact with its environment, answer requests, and do various computations,
	 * along with an `$exports` property to which servlet scripts can attach their implementations.
	 */
	export interface Scope {
		httpd: httpd
		$loader: slime.old.Loader
		$parameters: Parameters
		$exports: Script
	}

	export namespace internal {
		export namespace $host {
			export interface Java {
				getClasspath?: slime.jrunscript.native.inonit.script.engine.Loader.Classes.Interface
				register: (_script: slime.jrunscript.native.inonit.script.servlet.Servlet.Script) => void
				getLoader(): slime.jrunscript.native.inonit.script.rhino.Engine.Loader
				getServlet(): slime.jrunscript.native.inonit.script.servlet.Servlet
			}

			export interface Rhino extends Java {
				getEngine(): slime.jrunscript.native.inonit.script.rhino.Engine
			}

			export interface jsh {
				context: slime.servlet.httpd["context"]

				api?: slime.servlet.internal.api

				loaders?: {
					api: slime.Loader
					script: slime.old.Loader
					container: slime.old.Loader
				}

				Loader: {
					tools: {
						toExportScope: slime.runtime.Exports["old"]["loader"]["tools"]["toExportScope"]
					}
				}

				/**
				 * The set of parameters to provide to the servlet. Note that unlike native Java servlets, `jsh`-embedded servlets
				 * may provide parameters of any type.
				 */
				parameters?: { [x: string]: any }

				loadServletScriptIntoScope?: (scope: Scope) => void

				$slime?: slime.jrunscript.runtime.Exports
				script?: (servlet: slime.servlet.internal.server.Servlet) => void
				server?: slime.servlet.internal.server.Exports
			}
		}

		export interface api {
			$api: slime.$api.Global
			/**
			 * @deprecated
			 */
			js: any
			java: httpd["java"]
			io: httpd["io"]
			web: slime.web.Exports
			loader: {
				paths: (prefix: string) => string[]
			}
		}

		export type $host = $host.Java | $host.jsh
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi._1 = function() {
				var tomcat = jsh.httpd.Tomcat();

				tomcat.map({
					path: "",
					servlets: {
						"/*": {
							load: function(scope) {
								scope.$exports.handle = function(request) {
									return {
										status: { code: 200 },
										body: {
											type: "application/json",
											string: JSON.stringify({
												"httpd.js": Boolean(scope.httpd.js),
												"httpd.web": Boolean(scope.httpd.web),
												"httpd.web.Url": Boolean(scope.httpd.web && scope.httpd.web.Url)
											})
										}
									};
								}
							}
						}
					}
				});

				tomcat.start();
				try {
					var response = new jsh.http.Client().request({
						url: "http://127.0.0.1:" + tomcat.port + "/",
						evaluate: function(response) {
							if (response.status.code != 200) {
								jsh.shell.console(response.body.stream.character().asString());
								throw new Error("Status code: " + response.status.code);
							}
							return JSON.parse(response.body.stream.character().asString());
						}
					});
					const asBoolean = (p: any): boolean => p as boolean;
					verify(response,"server")["httpd.js"].evaluate(asBoolean).is(true);
					verify(response,"server")["httpd.web"].evaluate(asBoolean).is(true);
					verify(response,"server")["httpd.web.Url"].evaluate(asBoolean).is(true);
				} finally {
					tomcat.stop();
				}

				//	TODO	test .war-style server
			};

			fifty.tests.jsapi._2 = function() {
				type Echo = {
					source: {
						ip: string
					},
					scheme: string
					method: string
					path: string
					query?: {
						string: string
						form: slime.web.form.Control[]
					}
				};

				var echo = function(request: slime.servlet.Request) {
					var response: Echo = {
						source: {
							ip: request.source.ip
						},
						scheme: request.scheme,
						method: request.method,
						path: request.path
					};
					if (request.query) {
						response.query = {
							string: request.query.string,
							form: request.query.form()
						}
					}
					return {
						status: { code: 200 },
						body: {
							type: "application/json",
							string: JSON.stringify(response,void(0),"\t")
						}
					};
				};

				if (jsh.httpd.Tomcat) {
					var server = jsh.httpd.Tomcat({
						https: {}
					});
					server.map({
						path: "",
						servlets: {
							"/*": {
								load: function(scope) {
									scope.$exports.handle = echo;
								}
							}
						}
					});
					server.start();

					var evaluateJson = function(response): Echo {
						if (response.status.code != 200) {
							throw new Error("Response code: " + response.status.code);
						}
						return JSON.parse(response.body.stream.character().asString()) as Echo;
					}

					try {
						var client = new jsh.http.Client();
						var response = client.request({
							url: "http://127.0.0.1:" + server.port + "/aPath",
							evaluate: evaluateJson
						});
						verify(response).source.ip.is("127.0.0.1");
						verify(response).scheme.is("http");
						verify(response).method.is("GET");
						verify(response).path.is("aPath");
						verify(response).evaluate.property("query").is(void(0));
						response = client.request({
							url: "http://127.0.0.1:" + server.port + "/aPath?aName=aValue",
							evaluate: evaluateJson
						});
						verify(response).path.is("aPath");
						verify(response).query.string.is("aName=aValue");
						verify(response).query.form[0].name.is("aName");
						verify(response).query.form[0].value.is("aValue");

						jsh.shell.console("port = " + server.https.port);

						jsh.http.test.disableHttpsSecurity();

						response = client.request({
							url: "https://127.0.0.1:" + server.https.port + "/aPath",
							evaluate: evaluateJson
						});
						//	TODO	can we detect incoming request was https?
						verify(response).source.ip.is("127.0.0.1");
						verify(response).scheme.is("https");
						verify(response).method.is("GET");
						verify(response).path.is("aPath");
						verify(response).evaluate.property("query").is(void(0));
					} catch (e) {
						throw e;
					} finally {
						server.stop();
					}
				}
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);
}
