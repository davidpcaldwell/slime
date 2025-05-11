//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client.object {
	export type Authorization = string

	export type parameters = { name: string, value: string }[] | jsapi.values

	/**
	 * Either a {@link parameters}, or a `string` representing a query string.
	 */
	export type query = parameters | string

	export type Implementation = (argument: spi.Argument) => Response

	export interface Request {
		/**
		 * The HTTP request method to use. If omitted, a `GET` is issued.
		 */
		method?: string

		/**
		 * The URL to which to issue the request.
		 */
		url: request.url

		/** @deprecated See `parameters`. */
		params?: parameters

		/**
		 * @deprecated
		 *
		 * Additional parameters to send to the request as part of the URL.
		 */
		parameters?: parameters

		/**
		 * Additional headers to send with this request.
		 */
		headers?: parameters

		/**
		 * Credentials information to be used to authorize this request.
		 */
		authorization?: Authorization

		/**
		 * The proxy server to use for this request.
		 */
		proxy?: Proxies

		/**
		 * The message body to use with the HTTP request. If no `type` property is provided, `application/octet-stream` will be
		 * used. Must specify its content in some way. If a `stream` property is present, it will be read to provide the content
		 * of the message body. Otherwise, if a `string` property is present, its content will be used.
		 */
		body?: request.Body

		timeout?: Timeouts

		/**
		 * An object containing a set of properties representing callbacks.
		 */
		on?: {
			//	TODO	what 'this' will be used for this function?
			/**
			 * A function that will be invoked if the request is redirected; note that the argument may be modified in order
			 * to stop the redirect from being followed.
			 */
			redirect: (p: {
				request: slime.jrunscript.http.client.object.Request
				response: slime.jrunscript.http.client.Response

				/**
				 * This property may be removed from the object in order to stop the client from following the redirect.
				 */
				next: {
					method: string
					url: slime.web.Url
				}
			}) => void
		}
	}

	/**
	 * A function intended to process an HTTP response.
	 */
	export type parser<T> = {
		(response: Response): T
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
		/**
		 * Issues a request to a server and returns that server's response, after following any redirects.
		 *
		 * @param p An object representing the request, with an optional `evaluate` property that processes the response.
		 * @returns The response, unless a <code>parse</code> function was provided; in that case, the result of that function
		 * is returned.
		 */
		request: {
			(p: Request & { evaluate: slime.external.lib.es5.JSON }): any

			<T>(p: Request & {
				/**
				 * A function that interprets the response from the server and returns it to the caller of `request()`
				 * automatically.
				 */
				evaluate: parser<T>
			}): T

			/**
			 * @deprecated Use `evaluate`, not `parse`.
			 */
			<T>(p: Request & { parse: parser<T> }): T
			(p: Request): Response
		},
		Loader: any
	}
}

namespace slime.jrunscript.http.client.internal.objects {
	export interface Context {
		Cookies: () => slime.jrunscript.http.client.internal.Cookies
		api: {
			io: slime.jrunscript.io.Exports
			web: slime.web.Exports
		}
		urlConnectionImplementation: slime.jrunscript.http.client.spi.Implementation
		sessionRequest: slime.jrunscript.http.client.internal.sessionRequest
		authorizedRequest: slime.jrunscript.http.client.internal.authorizedRequest
		proxiedRequest: slime.jrunscript.http.client.internal.proxiedRequest
		interpretRequestBody: slime.jrunscript.http.client.internal.interpretRequestBody
	}

	export type Export = {
		Client: slime.jrunscript.http.client.Exports["Client"]
		Body: {
			Form: slime.jrunscript.http.client.Exports["Body"]["Form"]
		}
		Authentication: slime.jrunscript.http.client.Exports["Authentication"]
		Parser: slime.jrunscript.http.client.Exports["Parser"]
	}

	export type Script = slime.loader.Script<Context,Export>
}
