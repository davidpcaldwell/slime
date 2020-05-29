namespace slime.servlet {
	interface Request {
		path: string
	}

	interface Response {
		status: { code: number }
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
				}
			}
		}
	}
}