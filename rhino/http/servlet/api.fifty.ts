//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet {
	export interface Parameters {
		[x: string]: any
	}

	/**
	 * The `httpd` property represents APIs available to every servlet.
	 */
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

		/**
		 * (conditional: not present if no resources specified when mapping the servlet) Loads code (and potentially other
		 * resources) from the servlet resource loader. Note that unlike Java servlet resource loaders, SLIME loaders do not use a
		 * leading slash as part of the resource path.
		 */
		loader?: slime.old.Loader

		/**
		 * @deprecated
		 */
		js: slime.$api.old.Exports

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

	/**
	 * A partial function that can handle some requests (and decline others). `Handler`s can be assembled into larger handlers,
	 * and eventually (with a default) be used to create a total function that can handle all requests.
	 */
	export type Handler = slime.$api.fp.Partial<Request,Response>

	//	TODO	if it doesn't assign a handle function, then what?
	//	TODO	indentation below is lost
	/**
	 * The servlet interacts with its container by assigning properties to its `$exports` object, provided in the scope. Each
	 * servlet must, at a minimum, assign a function to `$exports.handle`:
	 *
	 *     $exports.handle = function(request) {
	 *         return httpd.http.Response.text("Hello, World!");
	 *     }
	 *
	 * SLIME servlets do not have a separate initialization procedure as Java servlets do; they may perform any initialization in
	 * their script.
	 */
	export interface Script {
		/**
		 * Implements the behavior of the servlet: receives a call for each request, and returns a response.
		 *
		 * The method must not return `undefined`; if it does, the server will return a `500 Internal Server Error` status. If the
		 * servlet returns `null`, the server will return a `404 Not Found` status.
		 */
		handle: handler

		/**
		 * Called by the container when the servlet is destroyed.
		 */
		destroy?: () => void
	}

	/**
	 * Various objects and APIs that allow a servlet to interact with its environment, answer requests, and do various computations,
	 * along with an `$exports` property to which servlet scripts can attach their implementations.
	 */
	export interface Scope {
		httpd: httpd

		/**
		 * The `$loader` object is a *servlet-specific*
		 * {@link slime.old.Loader} that loads resources *relative to the servlet's path*. The
		 * `httpd.loader` object loads them from the application path. So if a servlet is located at `/WEB-INF/myapp/servlet.js`, it
		 * can load a JavaScript file at `/WEB-INF/myapp/code.js` via:
		 *
		 * * `httpd.loader.file("WEB-INF/myapp/code.js")`, or
		 * * `$loader.file("code.js")`.
		 */
		$loader: slime.old.Loader

		/**
		 * The `$parameters` object contains the set of servlet initialization parameters available to the servlet. These are set
		 * via the `web.xml` file when the servlet is declared. `$parameters` is a JavaScript object containing a property for each
		 * parameter whose name is the name of the parameter and whose value is the value of that parameter.
		 */
		$parameters: Parameters

		//	TODO	this can also be `$export` now.
		$exports: Script
	}

	export namespace internal {
		export interface Loaders {
			api: slime.Loader

			//	TODO absent for now in jsh-level servlets, but see comment in api.js about $loader
			script?: slime.old.Loader

			/**
			 * The global servlet resource loader; the loader that becomes `httpd.loader`. If not present, `httpd.loader`
			 * will not be present.
			 */
			container?: slime.old.Loader
		}

		export namespace $host {
			export interface jsh {
				context: slime.servlet.httpd["context"]

				api?: slime.servlet.internal.api

				loaders?: Loaders

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

		export type $host = slime.jrunscript.native.inonit.script.servlet.Servlet.HostObject | $host.jsh

		export interface Context {
			context: httpd["context"]
			loaders: Loaders
			api: api
			$slime: httpd["$slime"]
			reload: httpd["$reload"]

			//	TODO	jsh allows any type, not just string. Should consider how to deal with this.
			parameters: { [x: string]: string }

			loadServletScriptIntoScope: (scope: slime.servlet.Scope) => void
			Servlet: (script: slime.servlet.Script) => slime.servlet.internal.server.Servlet
			register: (servlet: slime.servlet.internal.server.Servlet) => void
		}
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
