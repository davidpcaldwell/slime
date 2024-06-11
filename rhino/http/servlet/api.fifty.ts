//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The SLIME servlet implementation allows Java servlets to be authored in JavaScript.
 */
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
}
