//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: internal.server.loader.Script = fifty.$loader.script("loader.js");
			return script({
				api: {
					web: fifty.global.jsh.web
				}
			});
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface httpd {
		Request: {
			host: (request: slime.servlet.Request) => string
		}
	}

	export namespace handler {
		export interface Exports {
			/**
			 * Creates a `Handler` from an ordered list of `Handler`s. Requests received by the resulting `Handler` will be handled
			 * by invoking each provided `Handler` in order and returning the first result that is not `undefined`.
			 */
			series: (...handlers: slime.servlet.handler[]) => slime.servlet.handler

			/**
			 *
			 * @param p
			 * @returns
			 */
			Child: (p: {
				/**
				 * An expression describing the set of requests serviced by this handler. If the path matches the expression, the
				 * (first) value captured by the expression will be used as the `path` property of the request to be passed to the
				 * handler.
				 */
				filter: RegExp,
				handle: slime.servlet.handler
			}) => slime.servlet.handler

			HostRedirect: (p: {
				from: string
				to: string
			}) => slime.servlet.handler

			Proxy: (o: {
				client: any
				target: { host: string, port: number }
				https?: { host: string, port: number }
			}) => slime.servlet.handler

			/**
			 * Creates a handler that delegates `GET` requests to a {@link slime.Loader} that loads
			 * {@link slime.jrunscript.runtime.old.Resource}s.
			 */
			Loader: (o: {
				loader: slime.old.Loader<slime.jrunscript.runtime.internal.CustomSource,slime.jrunscript.runtime.old.Resource>

				/**
				 * An optional path within the loader to use when a request with an empty path is received.
				 */
				index?: string
			}) => slime.servlet.handler
		}
	}

	export interface httpd {
		/**
		 * Provides a set of {@link slime.servlet.handler} implementations.
		 */
		Handler: handler.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const module = test.subject;

			fifty.tests.exports.Handler = fifty.test.Parent();

			var asRequest = function(partial) { return partial as slime.servlet.Request; };

			var Headers = function(host): ({ name: string, value: string }[] & { value: any }) {
				var rv = Object.assign(
					[{ name: "Host", value: host }],
					{ value: void(0) }
				);
				//	TODO	rv.value is copied from servlet server.js
				rv.value = function(name) {
					//	TODO	more robust check for multiple values, etc.
					for (var i=0; i<this.length; i++) {
						if (this[i].name.toLowerCase() == name.toLowerCase()) {
							return this[i].value;
						}
					}
				};
				return rv;
			}

			fifty.tests.exports.Handler.series = function() {
				var condition: slime.servlet.handler = function(request) {
					if (request.path == "condition") return { status: { code: 200 }, body: { type: "text/plain", string: "satisfied" } };
				};
				var nulling = function(request) { return null; };
				var handlers = {
					empty: module.Handler.series(),
					condition: module.Handler.series(condition,nulling)
				};
				var requests = {
					condition: { path: "condition" },
					root: { path: "" }
				};

				verify(handlers).empty(asRequest(requests.root)).is.type("undefined");
				verify(handlers).condition(asRequest(requests.root)).is.type("null");
				verify(handlers).condition(asRequest(requests.condition)).is.type("object");
				verify(handlers).condition(asRequest(requests.condition)).status.code.is(200);
			};

			fifty.tests.exports.Handler.Child = function() {
				verify(module).is(module);
				var handler = module.Handler.Child({
					filter: /^test\/(.*)/,
					handle: function(request) {
						return {
							status: {
								code: 200
							},
							body: {
								type: "text/plain",
								string: request.path
							}
						}
					}
				});
				verify(handler(asRequest({ path: "test/1" }))).body.evaluate.property("string").is("1");
				verify(handler(asRequest({ path: "x/1" }))).is(void(0));
			};

			fifty.tests.exports.Handler.HostRedirect = function() {
				//	TODO	how would this work for Slim applications not deployed at root?
				var a = module.Handler.HostRedirect({
					from: "foo.com",
					to: "www.foo.com"
				});
				var response = a(asRequest({
					path: "",
					headers: Headers("foo.com")
				}));
				verify(response).status.code.is(301);
				verify(response).headers[0].name.is("Location");
				verify(response).headers[0].value.is("http://www.foo.com/");

				var r2 = a(asRequest({
					method: "POST",
					path: "foo",
					headers: Headers("foo.com")
				}));
				verify(r2).status.code.is(301);
				verify(r2).headers[0].name.is("Location");
				verify(r2).headers[0].value.is("http://www.foo.com/foo");
			}

			fifty.tests.exports.Handler.Proxy = function() {
				if (jsh.httpd.Tomcat) {
					var backend = jsh.httpd.Tomcat();
					backend.servlet({
						load: function(scope) {
							scope.$exports.handle = function(request) {
								return {
									status: { code: 200 },
									body: {
										type: "application/json",
										string: JSON.stringify({
											server: "backend",
											request: {
												path: request.path
											}
										})
									}
								}
								return
							};
						}
					});

					var frontend = jsh.httpd.Tomcat();
					frontend.servlet(new function() {
						var handler = module.Handler.Proxy({
							client: new jsh.http.Client(),
							target: {
								host: "127.0.0.1",
								port: backend.port
							}
						});
						this.load = function(scope) {
							scope.$exports.handle = handler;
						}
					});

					backend.start();
					frontend.start();

					var client = new jsh.http.Client();

					type BodyType = {
						server: string
						request: {
							path: string
						}
					};

					var toBodyType = function(body) {
						return body as BodyType;
					}
					var response = client.request({
						url: "http://127.0.0.1:" + frontend.port + "/" + "path",
						evaluate: function(response) {
							if (response.status.code == 200) {
								return {
									status: response.status,
									headers: response.headers,
									body: JSON.parse(response.body.stream.character().asString())
								};
							} else {
								throw new Error("Response code: " + response.status.code);
							}
						}
					});
					verify(response).status.code.is(200);
					verify(response).body.evaluate(toBodyType).server.is("backend");
					verify(response).body.evaluate(toBodyType).request.path.is("path");
				}
			};

			fifty.tests.exports.Handler.Loader = function() {
				if (jsh.httpd.Tomcat) {
					var server = jsh.httpd.Tomcat();
					server.servlet(new function() {
						this.load = function(scope) {
							scope.$exports.handle = module.Handler.Loader({
								//@ts-ignore
								loader: fifty.$loader
							});
						}
					});
					server.start();

					var client = new jsh.http.Client();

					var found = client.request({
						url: "http://127.0.0.1:" + server.port + "/" + "loader.fifty.ts"
					});
					verify(found).status.code.is(200);

					var notFound = client.request({
						url: "http://127.0.0.1:" + server.port + "/" + "nonexistent"
					});
					verify(notFound).status.code.is(404);

					var index = client.request({
						url: "http://127.0.0.1:" + server.port + "/" + ""
					});
					verify(index).status.code.is(404);

					server.stop();

					server = jsh.httpd.Tomcat();
					server.servlet(new function() {
						this.load = function(scope) {
							scope.$exports.handle = module.Handler.Loader({
								//@ts-ignore
								loader: fifty.$loader,
								index: "loader.fifty.ts"
							});
						}
					});
					server.start();
					var index = client.request({
						url: "http://127.0.0.1:" + server.port + "/" + ""
					});
					verify(index).status.code.is(200);
					server.stop();
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export interface httpd {
		/**
		 * Provides HTTP constructs to be used in constructing responses.
		 */
		http: {
			Response: {
				/**
				 * Convenience method for returning a `text/plain` response.
				 *
				 * @param string The text to return.
				 * @returns A response object which returns the given response, with a `200 OK` status and no additional headers.
				 */
				text: (string: string) => Response
				resource: (body: slime.jrunscript.runtime.old.Resource) => Response
				NOT_FOUND: () => Response

				SEE_OTHER: (p: {
					location: string
				}) => Response

				TEMPORARY_REDIRECT: (p: {
					location: string
				}) => Response

				javascript: (code: string) => Response
				cookie: (p: {
					name: string
					value: string
					expires?: Date
					maxAge?: number
					domain?: string
					path?: string
					secure?: boolean
					httpOnly?: boolean
					sameSite?: "Strict" | "Lax" | "None"
				}) => slime.servlet.Header
			}
		}
	}

	export namespace internal.server.loader {
		export interface Context {
			api: {
				web: slime.web.Exports
			}
		}

		export interface Export {
			Request: slime.servlet.httpd["Request"]
			Handler: slime.servlet.httpd["Handler"]
			http: slime.servlet.httpd["http"]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.suite = function() {
					fifty.run(fifty.tests.exports);
				}
			}
		//@ts-ignore
		)(fifty);

		export type Script = slime.loader.Script<Context,Export>
	}
}
