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
		export type authorization = any
	}

	export interface Header {
		name: string
		value: string
	}

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
			proxy?: Proxy
			body?: request.Body
			timeout?: Timeouts
			on?: any
		}

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

		export interface Response {
			request: Request
			/**
			 * See https://datatracker.ietf.org/doc/html/rfc7230#section-3.1.2
			 */
			status: {
				code: number
				reason: string
			}
			headers: Header[]
			body: {
				type: slime.mime.Type
				//	TODO	Possibly should be slime.jrunscript.InputStream or slime.jrunscript.io.InputStream
				stream: slime.jrunscript.runtime.io.InputStream
			}
		}

		export interface Configuration {
			authorization?: any
			spi?: (standard: spi.old.implementation) => spi.old.implementation
			proxy?: Proxy | ((p: object.Request) => Proxy)
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
			proxy: Proxy
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
				proxy: Proxy
				timeout: Timeouts
			}

			export type implementation = (p: Request) => Response
		}
	}

	export interface Proxy {
		http?: {
			host: any
			port: any
		}
		https?: {
			host: any
			port: any
		}
		socks?: {
			host: any
			port: any
		}
	}

	export interface Timeouts {
		connect: any
		read: any
	}

	export interface Exports {
		Client: new (configuration?: object.Configuration) => object.Client

		Authentication: {
			Basic: {
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

		Loader: any

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
}

namespace slime.jrunscript.http.client.internal {
	export type Parameters = (p: slime.jrunscript.http.client.parameters) => pair[]

	type ArgumentDecorator = (argument: slime.jrunscript.http.client.spi.Argument ) => slime.jrunscript.http.client.spi.Argument

	export type sessionRequest = (cookies: slime.jrunscript.http.client.internal.Cookies) => ArgumentDecorator
	export type authorizedRequest = (authorization: string) => ArgumentDecorator
	export type proxiedRequest = (proxy: slime.jrunscript.http.client.Proxy) => ArgumentDecorator
}