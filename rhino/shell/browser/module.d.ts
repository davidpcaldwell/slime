namespace slime.jrunscript.shell.browser {
	interface Context {
		api: {
			httpd: {
				Tomcat: new (p: {}) => jsh.httpd.Tomcat
			}
		}
	}

	interface ProxyConfiguration {
		code?: string
		pac?: string
		port?: number
	}

	interface Exports {
		inject: any

		chrome: any

		ProxyConfiguration: (o: ProxyConfiguration) => {
			Server: () => {
				url: string
				start: () => void
				stop: () => void
			}
			code: string
			response: slime.servlet.Response
		}
	}
}