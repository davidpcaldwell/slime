namespace slime.servlet {
	interface Request {
		path: string
	}

	interface Response {
		status: { code: number }
		body?: slime.Resource | {
			type: string,
			string: string
		}
	}

	type handler = (request: Request) => Response

	interface Scope {
		httpd: {
			js: any,
			java: any,
			io: any,
			web: any,
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
		$exports: {
			handle: Function
		}
	}
}