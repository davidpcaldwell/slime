namespace slime.servlet {
	interface httpd {
		Handler: {
			series: (...handlers: slime.servlet.handler[]) => slime.servlet.handler
			Child: (p: {
				filter: RegExp,
				handle: slime.servlet.handler
			}) => slime.servlet.handler
			HostRedirect: any
			Loader: (o: {
				loader: slime.Loader
				index?: string
			}) => slime.servlet.handler
			Proxy: any
		}
		http: {
			Response: {
				text: (string: string) => Response
				resource: (body: slime.jrunscript.runtime.Resource) => Response
				NOT_FOUND: () => Response
				SEE_OTHER: () => Response
				javascript: (code: string) => Response
			}
		}
	}
}