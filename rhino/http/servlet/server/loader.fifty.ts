//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet {
	export interface httpd {
		Request: {
			host: (request: slime.servlet.Request) => string
		}
		Handler: {
			series: (...handlers: slime.servlet.handler[]) => slime.servlet.handler
			Child: (p: {
				filter: RegExp,
				handle: slime.servlet.handler
			}) => slime.servlet.handler
			HostRedirect: any

			/**
			 * Creates a handler that serves the contents of a {@link slime.Loader} that loads
			 * {@link slime.jrunscript.runtime.old.Resource}s.
			 */
			Loader: (o: {
				loader: slime.old.Loader<slime.jrunscript.runtime.internal.CustomSource,slime.jrunscript.runtime.old.Resource>

				/**
				 * An optional path within the loader to use if the path is empty.
				 */
				index?: string
			}) => slime.servlet.handler

			Proxy: (o: {
				client: any
				target: { host: string, port: number }
				https: { host: string, port: number }
			}) => slime.servlet.handler
		}
		http: {
			Response: {
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

		export type Script = slime.loader.Script<Context,Export>
	}
}
