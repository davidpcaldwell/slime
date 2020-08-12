namespace slime.servlet {
	interface Header {
		name: string
		value: string
	}

	type Headers = Array<Header> & { value: Function }

	interface Request {
		headers: Headers
		method: string
		path: string
	}

	interface Response {
		status: { code: number }
		headers?: Header[]
		body?: (
			slime.jrunscript.runtime.Resource
			| {
				type: string,
				string: string
			}
			| {
				type: string,
				stream: any
			}
		)
	}

	type handler = (request: Request) => Response

	interface Scope {
		httpd: {
			$java: any
			$reload?: () => void
			loader: any
			js: any
			java: any
			io: any
			web: any
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
			}
		}
		$loader: slime.Loader
		$parameters: any
		$exports: {
			handle: (request: Request) => Response
			destroy?: () => void
		}
	}
}