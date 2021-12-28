//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet {
	export interface Header {
		name: string
		value: string
	}

	export type Headers = Array<Header> & { value: Function }

	export interface Request {
		uri: slime.web.Url
		source: {
			ip: string
		}
		scheme: string
		method: string
		path: string

		/**
		 * The query string; provided only if a query string is present on the request.
		 */
		query?: {
			string: string
			form: {
				(p: ObjectConstructor): slime.web.Form
				(): slime.web.form.Control[]
			}
		}

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

		user?: {
			name: string
		}
		body?: {
			form: () => slime.web.Form
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

	export interface Response {
		status: { code: number }
		headers?: Header[]
		body?: (
			slime.jrunscript.runtime.Resource
			| {
				type: string | slime.mime.Type,
				string: string
			}
			| {
				type: string | slime.mime.Type,
				stream: any
			}
		)
	}
}