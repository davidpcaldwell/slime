//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The SLIME servlet implementation allows Java servlets to be authored in JavaScript.
 */
namespace slime.servlet {
	interface Parameters {
		[x: string]: any
	}

	export interface httpd {
		loader: slime.Loader
		js: any
		java: slime.jrunscript.host.Exports
		io: slime.jrunscript.io.Exports
		web: slime.web.Exports
		$java: any
		$reload?: () => void
	}

	export type handler = (request: Request) => Response

	interface Script {
		handle: handler
		destroy?: () => void
	}

	/**
	 * Various objects and APIs that allow a servlet to interact with its environment, answer requests, and do various computations.
	 */
	export interface Scope {
		httpd: httpd
		$loader: slime.Loader
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
				api?: any
				loaders?: any
				Loader: any
				parameters?: { [x: string]: any }
				getCode?: any
				$java?: any
				script?: any
				server?: any
			}
		}

		export type $host = $host.Java | $host.jsh

		export namespace server {
			export interface Exports {
				Servlet: new (script: slime.servlet.Scope["$exports"]) => {
					reload: (script: slime.servlet.Scope["$exports"]) => void
					service: (_request: any, _response: any) => void
					destroy: () => void
				}
			}
		}
	}
}