//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client {
	//	See ../../../js/web/api.html#types.pair
	export type pair = { name: string, value: string }

	export type parameters = pair[] | jsapi.values

	/**
	 * Either a {@link parameters}, or a `string` representing a query string.
	 */
	export type query = parameters | string

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
		export type body = object.request.Body

		/**
		 * A header value for the `Authorization:` header suitable for authorizing a request.
		 */
		export type authorization = Authorization;

		export const scope = (function(Packages: any, JavaAdapter: any, fifty: slime.fifty.test.kit) {
			function s(Packages: any, JavaAdapter: any, fifty: slime.fifty.test.kit): slime.jrunscript.http.client.test.Scope {
				var scope: slime.jrunscript.http.client.test.Scope = {
					servlet: void(0),
					tomcat: void(0),
					$Context: void(0),
					context: void(0),
					module: void(0)
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
				fifty: slime.fifty.test.kit
			) {
				var scope = jsapi.scope;
				var module = scope.module;
				var context = scope.context;
				var verify = fifty.verify;
				fifty.tests.spi = function() {
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

	}

	export type Header = pair

	type Authorization = string

	export namespace object {
		export interface Request {
			method?: string
			url: slime.web.Url | string

			/** @deprecated */
			params?: parameters
			/** @deprecated */
			parameters?: parameters

			headers?: parameters
			authorization?: Authorization
			proxy?: Proxies
			body?: request.Body
			timeout?: Timeouts
			on?: any
		}

		/**
		 * A function intended to process an HTTP response.
		 */
		export type parser<T> = {
			(response: Response): T
		}

		export namespace request {
			/**
			 * A message body.
			 */
			export type Body = body.Stream | body.Binary | body.String

			export namespace body {
				type Type = {
					/**
					 * The MIME type of the message body.
					 */
					type: slime.mime.Type | string
				}
				export type Stream = Type & {
					/**
					 * A stream from which the content of the message body can be read.
					 */
					stream: slime.jrunscript.runtime.io.InputStream
				}
				export type Binary = Type & { read: { binary: () => slime.jrunscript.runtime.io.InputStream } }
				export type String = Type & {
					/**
					 * The content of the message body, as a string.
					 */
					string: string
				}
			}
		}

		/**
		 * Represents an HTTP response. See [RFC 2616, section 6](http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html).
		 */
		export interface Response {
			request: Request
			/**
			 * An object describing the response status.
			 *
			 * See https://datatracker.ietf.org/doc/html/rfc7230#section-3.1.2.
			 *
			 * See [RFC 2616 section 6.1](http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1)
			 */
			status: {
				/**
				 * The status code.
				 */
				code: number

				/**
				 * The message associated with the status code (RFC calls it "reason phrase").
				 */
				reason: string
			}
			headers: Header[] & {
				/**
				 * Provides the value or values of a given header.
				 *
				 * @param name A header name; case-insensitive.
				 * @returns the single value of the given header, if it has one, or an array of values if there are multiple values.
				 * If the header has no values, `null` is returned.
				 */
				get: (name: string) => string | string[]
			}
			/**
			 * The message body associated with this response.
			 */
			body: {
				type: slime.mime.Type
				stream: slime.jrunscript.runtime.io.InputStream
			}
		}

		export interface Configuration {
			/**
			 * A value to be used to authorize requests from this client.
			 */
			authorization?: Authorization

			spi?: (standard: spi.old.implementation) => spi.old.implementation

			/**
			 * A proxy server to use for requests, or a function specifying logic for determining the proxy server to use for a
			 * given request.
			 *
			 * @param p The argument provided for a particular request
			 *
			 * @returns The proxy server to use for the given request.
			 */
			proxy?: Proxies | (
				(p: object.Request) => Proxies
			)

			/**
			 * Instructs the client to handle responses with status 302 as though they were responses with status 303, as most
			 * browsers erroneously do. See the note at the end of
			 * [RFC 2616 10.3.3](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.3) for details.
			 */
			TREAT_302_AS_303?: boolean
		}

		export interface Client {
			request: {
				(p: Request & { evaluate: JSON }): any
				<T>(p: Request & { evaluate: parser<T> }): T
				<T>(p: Request & { parse: parser<T> }): T
				(p: Request): Response
			},
			Loader: any
		}
	}

	export interface Context {
		debug: any

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
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}
	}

	export namespace spi {
		export interface Argument {
			request: {
				method: string
				url: slime.web.Url
				headers: Header[]
				body: {
					type: slime.mime.Type
					stream: slime.jrunscript.runtime.io.InputStream
				}
			}
			proxy: Proxies
			timeout: Timeouts
		}

		export interface Response {
			status: {
				code: number
				reason: string
			}
			headers: Header[]
			stream: slime.jrunscript.runtime.io.InputStream
		}

		export type Implementation = (argument: Argument) => Response

		export namespace old {
			export interface Request {
				method: string
				url: slime.web.Url
				headers: Header[]
				body: object.request.Body
				proxy: Proxies
				timeout: Timeouts
			}

			export type implementation = (p: Request) => Response
		}
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
		connect: any
		read: any
	}

	export interface Exports {
		/**
		 * Creates an object capable of issuing HTTP requests and returning their responses.
		 *
		 * @param configuration An object describing the configuration of this HTTP client.
		 */
		Client: new (configuration?: object.Configuration) => object.Client
	}

	export interface Exports {
		/** Contains interfaces for implementing HTTP authentication. */
		Authentication: {
			/**
			 * The Basic authentication scheme, described by [RFC 2617](http://www.ietf.org/rfc/rfc2617.txt) section 2.
			 */
			Basic: {
				/**
				 * Creates objects representing a particular set of authorization credentials.
				 *
				 * @param p A set of credentials.
				 */
				Authorization: (p: { user: string, password: string }) => Authorization
			}
		}

		test: {
			disableHttpsSecurity()
		}

		//	TODO	Better API would have Form object that could be translated into query string and body, and probably
		//			have two subtypes: one for ordinary forms, another for multipart
		/**
		 * Contains methods for creating request bodies.
		 */
		Body: {
			/**
			 * Creates request bodies representing HTML non-multipart (`application/x-www-form-urlencoded`) forms.
			 * See [HTML 4.01 section 17.13.3](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.3).
			 *
			 * @param query An object specifying the form.
			 * @returns Objects suitable as request bodies.
			 */
			Form: (query: query) => object.request.Body
		}

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
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.spi);
			}
		}
	//@ts-ignore
	)(fifty);

}

namespace slime.jrunscript.http.client.internal {
	export type Parameters = (p: slime.jrunscript.http.client.parameters) => pair[]

	type ArgumentDecorator = (argument: slime.jrunscript.http.client.spi.Argument ) => slime.jrunscript.http.client.spi.Argument

	export type sessionRequest = (cookies: slime.jrunscript.http.client.internal.Cookies) => ArgumentDecorator
	export type authorizedRequest = (authorization: string) => ArgumentDecorator
	export type proxiedRequest = (proxy: slime.jrunscript.http.client.Proxies) => ArgumentDecorator
}