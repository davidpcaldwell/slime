namespace slime.servlet {
	interface Header {
		name: string
		value: string
	}

	type Headers = Array<Header> & { value: Function }

	interface Request {
		uri: slime.web.Url
		source: {
			ip: string
		}
		scheme: string
		method: string
		path: string
		query?: {
			string: string
			form: {
				(p: ObjectConstructor): slime.web.Form
				(): slime.web.Form.Control[]
			}
		}
		headers: Headers
		user?: {
			name: string
		}
		body?: {
			form: () => slime.web.Form
			stream: slime.jrunscript.runtime.io.InputStream
		}
	}

	interface Response {
		status: { code: number }
		headers?: Header[]
		body?: (
			slime.jrunscript.runtime.Resource
			| {
				type: string | slime.MimeType,
				string: string
			}
			| {
				type: string | slime.MimeType,
				stream: any
			}
		)
	}

	interface Parameters {
		[x: string]: any
	}

	interface httpd {
		loader: slime.Loader
		js: any
		java: any
		io: any
		web: slime.web.Exports
		http: {
			Response: {
				text: (string: string) => Response
				resource: (body: slime.Resource) => Response
			}
		},
		Handler: {
			series: (...handlers: slime.servlet.handler[]) => slime.servlet.handler
			Child: (p: {
				filter: RegExp,
				handle: slime.servlet.handler
			}) => slime.servlet.handler
			HostRedirect: any
			Loader: any
		}
		$java: any
		$reload?: () => void
	}

	type handler = (request: Request) => Response

	interface Script {
		handle: handler
		destroy?: () => void
	}

	interface Scope {
		httpd: httpd
		$loader: slime.Loader
		$parameters: Parameters
		$exports: Script
	}

	namespace internal {
		namespace $host {
			interface Java {
				getClasspath?: slime.jrunscript.native.inonit.script.engine.Loader.Classes.Interface
				register: (_script: slime.jrunscript.native.inonit.script.servlet.Servlet.Script) => void
				getLoader?: slime.jrunscript.native.inonit.script.Engine.Loader
				getServlet?: slime.jrunscript.native.inonit.script.servlet.Servlet
			}

			interface Rhino extends Java {
				getEngine?: slime.jrunscript.native.inonit.script.rhino.Engine
			}

			interface jsh {
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

		type $host = $host.Java | $host.jsh

		namespace server {
			interface Exports {
				Servlet: new (script: slime.servlet.Scope["$exports"]) => {
					reload: (script: slime.servlet.Scope["$exports"]) => void
					service: (_request: any, _response: any) => void
					destroy: () => void
				}
			}
		}
	}
}