namespace slime.jrunscript.http.client {
	type Pairs = { name: string, value: string }[] | { [x: string]: string | string[] }

	interface Request {
		method?: string
		url: any
		headers?: Pairs
		params?: Pairs
		parameters?: Pairs
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
			type: slime.MimeType
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

	interface Context {
		debug: any
		gae: any
		api: {
			web: any
			java: any
			js: any
			io: any
		}
	}

	interface Exports {
		Client: new (configuration?: {
			authorization?: any
			spi?: any
			proxy?: any
			TREAT_302_AS_303?: boolean
		}) => Client

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