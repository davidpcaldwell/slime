//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet {
	/**
	 * Represents an HTTP header. The value of the `name` property should be treated as case-insensitive.
	 */
	export interface Header {
		/**
		 * The name of the header.
		 */
		name: string

		/**
		 * The value of the header.
		 */
		value: string
	}

	export type Headers = (
		Array<Header>
		& {
			/**
			 * Returns the value of the given header as a string. Multiple values will be comma-delimited, per RFC 2616.
			 *
			 * @param name A (case-insensitive) header name.
			 * @returns The value of that header, or `null` if it is not present.
			 */
			value: (name: string) => string
		}
	)

	/**
	 * An HTTP request from a client.
	 */
	export interface Request {
		uri: slime.web.Url

		url: slime.web.Url

		source: {
			/**
			 * The remote IP address of the requestor.
			 */
			ip: string
		}

		scheme: string

		/**
		 * The HTTP method used for the request, as an uppercase string.
		 */
		method: string

		/**
		 * The path used for the request, relative to the webapp. Note that unlike in Java servlets, and many other HTTP server
		 * environments, this path does not contain a leading `/`.
		 */
		path: string

		/**
		 * The query string; provided only if a query string is present on the request.
		 */
		query?: {
			/**
			 * The query string of the requested URL.
			 */
			string: string

			form: {
				(p: ObjectConstructor): slime.web.Form
				(): slime.web.form.Control[]
			}
		}

		// //	Commenting out the below because it is believed to be unused
		// /** @deprecated Replaced by `query.form()` */
		// parameters?: slime.web.form.Control[]

		/**
		 * The headers included with this request.
		 */
		headers: Headers

		cookies: {
			name: string
			value: string
			maxAge: number
			domain: string
			path: string
			secure: boolean
			httpOnly: boolean
			//	TODO	Java does not support SameSite
		}[]

		/**
		 * Represents a user; see
		 * `[getUserPrincipal()](https://docs.oracle.com/javaee/7/api/javax/servlet/http/HttpServletRequest.html#getUserPrincipal--)`.
		 */
		user?: {
			/**
			 * Represents the name of the user; see
			 * `[getUserPrincipal().getName()](https://docs.oracle.com/javase/8/docs/api/java/security/Principal.html)`
			 */
			name: string
		}

		/**
		 * The body of the request.
		 */
		body?: {
			/**
			 * The MIME type of the request body.
			 */
			type: slime.mime.Object

			form: () => slime.web.Form

			/**
			 * A stream from which the request body can be read.
			 */
			stream: slime.jrunscript.runtime.io.InputStream
		}
	}

	export namespace internal {
		export namespace native {
			interface HttpServletRequest {
				getMethod(): slime.jrunscript.native.java.lang.String
				getPathInfo(): slime.jrunscript.native.java.lang.String
				getDateHeader(name: string): number
			}

			interface HttpServletResponse {
				sendError(code: number, message?: string)
				setStatus(code: number)
				addHeader(name: string, value: string)
				setContentType(type: string)
				setContentLength(length: number)
				setDateHeader(name: string, value: number)
				getWriter(): slime.jrunscript.native.java.io.Writer
				getOutputStream(): slime.jrunscript.native.java.io.OutputStream
			}

			//	This type seems to maybe be the slime.jrunscript.native.inonit.script.servlet.Servlet.Script type?
			//	TODO	possibly the types in this namespace predate the slime.jrunscript.native convention for dealing with Java
			//			types and should be merged with their Java equivalents and migrated
			export namespace Servlet {
				export interface Script {
					service(_request: HttpServletRequest, _response: HttpServletResponse)
					destroy()
				}
			}
		}

		export namespace server {
			export interface Context {
				api: slime.servlet.internal.api
			}

			export interface Servlet extends slime.jrunscript.native.inonit.script.servlet.Servlet.Script {
				reload: (script: slime.servlet.Scope["$exports"]) => void
			}

			export interface Exports {
				Servlet: (script: slime.servlet.Scope["$exports"]) => Servlet
			}

			export type Script = slime.loader.Script<Context,Exports>
		}
	}

	export namespace response {
		export interface Properties {
			/**
			 * The MIME type of the request body.
			 */
			type?: string | slime.mime.Type

			/**
			 * The length of the content, in bytes. Used to set the `Content-Length` header in the response.
			 */
			length?: number

			/**
			 * The date that the content was last modified. Used to set the `Last-Modified` header.
			 */
			modified?: Date
		}
	}

	/**
	 * A response to be sent to a client in response to a request.
	 *
	 * The content of the body must be specified in some way. Using a resource causes the type and content to be specified; note
	 * that using a Java {@link slime.jrunscript.runtime.old.Resource} automatically provides other capabilities (`Last-Modified`
	 * and `Content-Length` headers).
	 */
	export interface Response {
		/**
		 * The status to use in the response.
		 */
		status: {
			/**
			 * The HTTP status code to use in the response to the client.
			 */
			code: number
		}

		/**
		 * Headers to use in the response.
		 */
		headers?: Header[]

		/**
		 * The HTTP request body to send to the client.
		 */
		body?: (
			slime.jrunscript.runtime.old.Resource
			| response.Properties & {
				/**
				 * The message body to send to the client, as a string.
				 */
				string: string
			}
			| response.Properties & {
				/**
				 * A stream from which the message body to send to the client may be read.
				 */
				stream: slime.jrunscript.runtime.io.InputStream
			}
		)
	}
}
