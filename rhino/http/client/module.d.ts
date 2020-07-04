namespace slime.jrunscript.http.client {
	interface Request {
		method?: string
		url: any
		headers?: any
		params?: any
		parameters?: any
		authorization?: Authorization
		proxy?: any
		body?: any
		timeout?: any
		on?: any
	}

	interface Response {
		request: Request
		status: any
		headers: any
		body: {
			type: slime.MimeType,
			//	TODO	Possibly should be slime.jrunscript.InputStream or slime.jrunscript.io.InputStream
			stream: slime.jrunscript.runtime.io.InputStream
		}
	}

	type Authorization = string

	interface request {
		(p: Request & { evaluate: JSON }): any
		<T>(p: Request & { evaluate: (Response) => T }): T
		<T>(p: Request & { parse: (Response) => T }): T
		(p: Request): Response
	}

	interface Client {
		request: request,
		Loader: any
	}

	interface Exports {
		Client: new (configuration?: {}) => Client

		Authentication: {
			Basic: {
				Authorization: (p: { user: string, password: string }) => Authorization
			}
		}

		test: {
			disableHttpsSecurity()
		}

		Body: any
		Loader: any
		Parser: any
	}
}