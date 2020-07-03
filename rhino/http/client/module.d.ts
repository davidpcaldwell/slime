namespace slime.jrunscript.http.client {
	interface Client {
		request: Function
	}

	type Authorization = string

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