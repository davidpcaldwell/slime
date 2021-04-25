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

		/**
		 * The query string; provided only if a query string is present on the request.
		 */
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
}