//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.types = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Context {
		//	TODO	replace with individual properties governing these behaviors, and/or see whether the whole thing is obsolete
		/**
		 * If `true`, avoids the use of classes that are not whitelisted in Google App Engine. Currently, this means that a custom
		 * cookie handler is supplied, rather than using the default from the `java.net` package.
		 */
		gae: boolean

		/**
		 * Modules used in implementing the HTTP client.
		 */
		api: {
			web: slime.web.Exports
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: slime.loader.Script<Context,Exports> = fifty.$loader.script("module.js");
			var api = script({
				gae: false,
				api: {
					web: fifty.global.jsh.web,
					java: fifty.global.jsh.java,
					io: fifty.global.jsh.io
				}
			});
			return api;
		//@ts-ignore
		})(fifty)
	}

	export type Header = { name: string, value: string }

	export namespace exports {
		export interface Header {
			value: (name: string) => (header: slime.jrunscript.http.client.Header[]) => slime.$api.fp.Maybe<string>
			values: (name: string) => (header: slime.jrunscript.http.client.Header[]) => string[]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.exports.Header = function() {
					var headers = [
						{ name: "foo", value: "bar" },
						{ name: "baz", value: "bizzy" },
						{ name: "Baz", value: "bizzy2" }
					];

					var subject = test.subject.Header;

					verify(headers).evaluate(subject.value("foo")).present.is(true);
					verify(headers).evaluate(subject.value("bar")).present.is(false);
					verify(headers).evaluate(subject.value("Foo")).present.is(true);

					verify(headers).evaluate(subject.values("baz")).length.is(2);
					verify(headers).evaluate(subject.values("baz"))[0].is("bizzy");
					verify(headers).evaluate(subject.values("baz"))[1].is("bizzy2");
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export interface Exports {
		Header: exports.Header
	}

	/** Information specifying a proxy server. */
	export interface Proxy {
		/** A host name. */
		host: string
		/** A port number. */
		port: number
	}

	//	TODO	can you specify all of these, or just one? Or none?
	/**
	 * An object that specifies a server through which to proxy a request.
	 *
	 * This object should contain a `http` property or a `socks` property specifying information about the proxy to use.
	 */
	export interface Proxies {
		/** Specifies an HTTP proxy to use for this request. */
		http?: Proxy
		https?: Proxy
		/** Specifies a SOCKS proxy to use for this request. */
		socks?: Proxy
	}

	export interface Timeouts {
		/**
		 * A timeout, in milliseconds, that should be used when attempting to connect to a remote URL.
		 */
		connect: number

		/**
		 * A timeout, in milliseconds, that should be used when attempting to read a remote URL.
		 */
		read: number
	}

	export namespace exports {
		/**
		 * Contains methods for creating request bodies.
		 */
		export interface Body {
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Body = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Body {
			/**
			 * Creates request bodies representing HTML non-multipart (`application/x-www-form-urlencoded`) forms.
			 * See [HTML 4.01 section 17.13.3](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.3).
			 *
			 * @param query An object specifying the form.
			 * @returns Objects suitable as request bodies.
			 */
			Form: (query: object.query) => request.Body
		}
	}

	export namespace exports {
		export interface Body {
			json: () => (value: any) => spi.request.Body
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.exports.Body.json = function() {
					var body = test.subject.Body.json()({ hello: "world" });
					verify(body).type.media.is("application");
					verify(body).type.subtype.is("json");
					var parsed: { hello: string } = JSON.parse(body.stream.character().asString());
					verify(parsed).hello.is("world");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Body: exports.Body
	}

	export namespace request {
		export type url = slime.web.Url | string

		/**
		 * A message body.
		 */
		export type Body = body.Resource | body.String

		export namespace body {
			type WithMimeType = {
				/**
				 * The MIME type of the message body.
				 */
				type: slime.mime.Type | string
			}

			export type Resource = WithMimeType & { read: { binary: () => slime.jrunscript.runtime.io.InputStream } }

			export type String = WithMimeType & {
				/**
				 * The content of the message body, as a string.
				 */
				string: string
			}
		}
	}

	export interface Request {
		method?: string
		url: request.url
		headers?: Header[]
		body?: request.Body
	}

	export interface Events {
		request: {
			url: slime.web.Url
			proxy: Proxies
		}
	}

	export interface Response {
		status: {
			code: number
			reason: string
		}
		headers: Header[]
		stream: slime.jrunscript.runtime.io.InputStream
	}

	export interface Exports {
		world: {
			java: {
				/** @deprecated Replaced by `Implementation.from.java`. */
				urlconnection: spi.Implementation
			}
		}
	}

	export interface Exports {
		Implementation: {
			from: {
				java: {
					urlconnection: spi.Implementation
				}
			}

			operations: {
				sensor: (implementation: spi.Implementation) => slime.$api.fp.world.Sensor<Request,Events,Response>
				withFollowRedirects: (implementation: spi.Implementation) => spi.Implementation
			}

			methods: (implementation: spi.Implementation) => slime.$api.fp.methods.Flattened<spi.Implementation,Exports["Implementation"]["operations"]>
		}

		Request: {
			spi: (request: Request) => spi.Argument
		}

		World: {
			/** @deprecated Use `Implementation.operations.withFollowRedirects`. */
			withFollowRedirects: (implementation: spi.Implementation) => spi.Implementation

			/** @deprecated Use `Implementation.operations.sensor`. */
			question: (implementation: spi.Implementation) => slime.$api.fp.world.Sensor<Request,Events,Response>
		}

		Argument: {
			from: {
				/** @deprecated Use `Request.spi`. */
				request: (request: Request) => spi.Argument
			}
		}
	}

	export interface Exports {
		/**
		 * Creates an object capable of issuing HTTP requests and returning their responses.
		 *
		 * @param configuration An object describing the configuration of this HTTP client.
		 */
		Client: new (configuration?: object.Configuration) => object.Client
		//	TODO	Better API would have Form object that could be translated into query string and body, and probably
		//			have two subtypes: one for ordinary forms, another for multipart

		/**
		 * Contains interfaces for manipulating parsers.
		 */
		Parser: {
			/**
			 * A function that creates parsers that throw errors when unsuccessful responses are received.
			 *
			 * @param parser A parser for successful responses.
			 * @returns A parser that invokes the given parser for successful responses, but throws an error for non-successful responses.
			 */
			ok: <T>(parser: object.parser<T>) => object.parser<T>
		}

		/** Contains interfaces for implementing HTTP authentication. */
		Authentication: {
			/**
			 * The Basic authentication scheme, described by [RFC 7617](https://datatracker.ietf.org/doc/html/rfc7617#section-2) section 2.
			 */
			Basic: {
				/**
				 * Creates objects representing a particular set of authorization credentials.
				 *
				 * @param p A set of credentials.
				 */
				Authorization: (p: { user: string, password: string }) => object.Authorization
			}
		}
	}

	/**
	 * @deprecated Represents constructs ported from the old JSAPI definition to ease transition of its tests to Fifty.
	 */
	export namespace jsapi {
		/**
		 * An object with properties. Each named property represents one or more <a href="#types.pair">pair</a> objects. If the value
		 * of the property is a <code>string</code>, the property represents a single pair with the given name and the given value. If
		 * the value of the property is an <code>Array</code> of <code>string</code>, the property represents a collection of pairs with
		 * the given name and the <code>string</code> values contained in the array.
		 */
		export type values = { [x: string]: string | string[] }

		/**
		 * @deprecated Replaced by {@link object.request.Body}.
		 */
		export type body = request.Body

		/**
		 * A header value for the `Authorization:` header suitable for authorizing a request.
		 */
		export type authorization = object.Authorization;

		export const scope = (function(Packages: any, JavaAdapter: any, fifty: slime.fifty.test.Kit) {
			function s(Packages: any, JavaAdapter: any, fifty: slime.fifty.test.Kit): slime.jrunscript.http.client.test.Scope {
				var scope: slime.jrunscript.http.client.test.Scope = {
					servlet: void(0),
					tomcat: void(0),
					$Context: void(0),
					context: void(0),
					module: void(0),
					Cookie: void(0),
					getServerRequestCookies: void(0),
					hasDefaultCookieHandler: void(0),
					skip: void(0)
				};
				var fixtures: slime.jrunscript.http.client.test.Fixtures = fifty.$loader.module("test/fixtures.ts");
				fixtures(
					Packages,
					JavaAdapter,
					fifty.global.jsh,
					{
						environment: {},
						loader: fifty.$loader
					},
					scope
				);
				return scope;
			}

			var rv = s(Packages, JavaAdapter, fifty);
			return rv;
		//@ts-ignore
		})(Packages,JavaAdapter,fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { jsh } = fifty.global;

				fifty.tests.exports.world = function() {
					fifty.load("spi.fifty.ts", "types.Implementation", jsh.http.world.java.urlconnection);
				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.jsapi = {};
			}
		//@ts-ignore
		)(fifty);


		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var { module, context, servlet } = jsapi.scope;
				var verify = fifty.verify;
				fifty.tests.jsapi.spi = function() {
					var client = new module.Client({
						spi: function(original) {
							return function(p) {
								var buffer = new context.io.Buffer();
								//	TODO	below was buffer.writeText("Hello, Dude!"), which counterintuitively, silently
								//			failed; consider alternatives for jrunscript/io
								buffer.writeText().write("Hello, Dude!");
								buffer.close();
								return {
									status: {
										code: 200,
										reason: "OK"
									},
									headers: [
										{ name: "Content-Type", value: "text/plain" }
									],
									stream: buffer.readBinary()
								}
							}
						}
					});
					var redirected = false;
					servlet.set(function(request,response) {
						response.setContentType("text/plain");
						response.getWriter().print("Hello, World!");
					});
					var response = client.request({
						method: "GET",
						url: "http://127.0.0.1:" + context.port + "/"
						,evaluate: function(response) {
							return response;
						}
					});
					//	TODO	add jrunscript/io Resource capability
					verify(response.body.stream.character().asString()).is("Hello, Dude!");
				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.jsapi.proxy = function() {
					var { context, module, servlet } = jsapi.scope;
					var verify = fifty.verify;

					fifty.run(function() {
						if (!context.notomcat) {
							servlet.set(function(_request,_response) {
								_response.getWriter().print(_request.getHeader("host"));
							});
							var lastArgument: object.Request;
							var client = new module.Client({
								proxy: function(request) {
									lastArgument = request;
									return {
										http: {
											host: "127.0.0.1",
											port: context.port
										}
									}
								}
							});
							var host = client.request({
								url: "http://foo.bar/baz",
								evaluate: function(response) {
									return response.body.stream.character().asString();
								}
							});
							//	TODO	seems to work in latest version of TypeScript
							//@ts-ignore
							verify(lastArgument).url.evaluate(function(p) { return String(p); }).is("http://foo.bar/baz");
							verify(host).is("foo.bar");
						}
					});

					fifty.run(function() {
						if (!context.notomcat) {
							var all = new module.Client({
								proxy: {
									http: {
										host: "127.0.0.1",
										port: context.port
									}
								}
							});
							var host2 = all.request({
								url: "http://foo.bar.baz/",
								evaluate: function(response) {
									return response.body.stream.character().asString();
							}
							});
							verify(host2).is("foo.bar.baz");
						}
					});
				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.jsapi.other = function() {
					const $jsapi = {
						environment: {
							windowsSocketsError10106: false
						}
					};

					const { context, module, servlet } = scope;
					const verify = fifty.verify;
					const jsh = fifty.global.jsh;
					const skip = scope.skip;
					const hasDefaultCookieHandler = scope.hasDefaultCookieHandler;
					const Cookie = scope.Cookie;
					const getServerRequestCookies = scope.getServerRequestCookies;

					fifty.run(function helloWorld() {
						if (!$jsapi.environment.windowsSocketsError10106 && !context.notomcat) {
							var client = new module.Client();
							servlet.set(function(request,response) {
								//	Nashorn does not allow request.getMethod() to be accessed through verify()
								var getRequestMethod = function() {
									return String(this._request.getMethod().toUpperCase());
								}
								verify({ _request: request }).evaluate(getRequestMethod).is("GET");
								response.getWriter().print("Hello, World!");
							});
							var response = client.request({
								method: "GET"
								,url: "http://127.0.0.1:" + context.port + "/"
								,evaluate: function(response) {
									return response.body.stream.character().asString();
								}
							});
							verify(response).is("Hello, World!");

							var byUrlObject = client.request({
								url: jsh.js.web.Url.parse("http://127.0.0.1:" + context.port + "/")
								,evaluate: function(response) {
									return response.body.stream.character().asString();
								}
							});
							verify(byUrlObject,"byUrlObject").is("Hello, World!");
						} else {
							skip(verify);
						}
					});

					fifty.run(function cookie() {
						if (!$jsapi.environment.windowsSocketsError10106 && !context.notomcat && !hasDefaultCookieHandler) {
							var client = new module.Client();
							servlet.set(function(request,response) {
								jsh.shell.echo("Received request; verify = " + verify);
								jsh.shell.echo("request.getCookies() = " + request.getCookies());
								//	TODO	for some reason with Nashorn, the verify() version of this statement does not work
								verify(request.getCookies() === null).is(true);
								//verify(request,"initial servlet request").getCookies().is(null);
								jsh.shell.echo("Cookie = " + Cookie);
								jsh.shell.echo("response.addCookie = " + response.addCookie);
								response.addCookie(new Cookie("cname", "cvalue"));
								jsh.shell.echo("addCookie returned");
								response.setContentType("text/plain");
								jsh.shell.echo("setContentType returned");
								response.getWriter().print("Hello, World!");
								jsh.shell.echo("getWriter().print returned");
								jsh.shell.echo("Reached end of set()");
							});
							var response = client.request({
								method: "GET"
								,url: "http://127.0.0.1:" + context.port + "/"
							});
							var type = response.body.type.toString();
							verify(type).is.not(null);
							verify(type.split(";"))[0].is.not(null);
							verify(response,"initial response").body.evaluate(function(p) { return p.type.toString().split(";")[0] }).is("text/plain");
							if (response.body.type.toString().substring(0,"text/html".length) == "text/html") {
								jsh.shell.echo("HTML response: " + response.body.stream.character().asString());
							}
							servlet.set(function(request,response) {
								var cookies = getServerRequestCookies(request);
								verify(cookies,"second servlet request cookies").length.is(1);
								verify(cookies,"cookies")[0].name.is("cname");
								verify(cookies,"cookies")[0].value.is("cvalue");
							});
							client.request({
								method: "GET"
								,url: "http://127.0.0.1:" + context.port + "/"
							});
						} else {
							skip(verify, "No Tomcat, or WebView present");
						}
					});

					fifty.run(function redirect() {
						if (!$jsapi.environment.windowsSocketsError10106 && !context.notomcat && !hasDefaultCookieHandler) {
							var client = new module.Client();
							var redirected = false;
							servlet.set(function(request,response) {
								jsh.shell.echo("getting cookies " + request.getCookies());
								var cookies = getServerRequestCookies(request);
								jsh.shell.echo("cookies: " + JSON.stringify(cookies));
								if (request.getRequestURI() == "/") {
									verify(cookies).length.is(0);
									response.addCookie(new Cookie("rname", "rvalue"));
									response.sendRedirect("./redirected");
								} else if (request.getRequestURI() == "/redirected") {
									redirected = true;
									verify(cookies).length.is(1);
	//								test(Boolean(request.getCookies()) && request.getCookies().length == 1);
									response.setContentType("text/plain");
									response.getWriter().print("Redirected!");
								} else {
									debugger;
									verify("url").is("Wrong URL: " + request.getRequestURI());
								}
							});
							var response = client.request({
								method: "GET",
								url: "http://127.0.0.1:" + context.port + "/"
								,evaluate: function(response) {
									jsh.shell.echo("response = " + response.status.code);
									jsh.shell.echo("error = ")
									return response;
								}
							});
							verify(redirected,"redirected").is(true);
						} else {
							skip(verify, "No Tomcat, or WebView present");
						}
					});

					fifty.run(function urlWithQueryString() {
						if (!$jsapi.environment.windowsSocketsError10106 && !context.notomcat) {
							var client = new module.Client();
							servlet.set(function(request,response) {
								response.getWriter().print(request.getRequestURL()+"?"+request.getQueryString());
							});
							var url = "http://127.0.0.1:" + context.port + "/hello?world=earth";
							var response = client.request({
								method: "GET"
								,url: url
								,evaluate: function(response) {
									return response.body.stream.character().asString();
								}
							});
							verify(response).is(url);
						} else {
							skip(verify);
						}
					});
				}
			}
		//@ts-ignore
		)(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);

				fifty.run(fifty.tests.jsapi.spi);
				fifty.run(fifty.tests.jsapi.proxy);
				fifty.run(fifty.tests.jsapi.other);

				if (fifty.global.jsh.shell.PATH.getCommand("curl")) {
					fifty.load("curl.fifty.ts");
				}
			}
		}
	//@ts-ignore
	)(fifty);

}

namespace slime.jrunscript.http.client.internal {
	export type Parameters = (p: slime.jrunscript.http.client.object.parameters) => { name: string, value: string }[]

	type ArgumentDecorator = (argument: slime.jrunscript.http.client.spi.Argument) => slime.jrunscript.http.client.spi.Argument

	export type sessionRequest = (cookies: slime.jrunscript.http.client.internal.Cookies) => ArgumentDecorator
	export type authorizedRequest = (authorization: string) => ArgumentDecorator
	export type proxiedRequest = (proxy: slime.jrunscript.http.client.Proxies) => ArgumentDecorator
	export type interpretRequestBody = (body: slime.jrunscript.http.client.request.Body) => slime.jrunscript.http.client.spi.request.Body
}
