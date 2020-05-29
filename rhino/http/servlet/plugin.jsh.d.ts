namespace jsh.httpd {
	interface servlet {
		parameters?: ({ [name: string]: any })
		file?: slime.jrunscript.file.File
		resource?: string
		load: (scope: {
			httpd: {
				Handler: {
					series: (...handlers: slime.servlet.handler[]) => slime.servlet.handler
					Child: (p: {
						filter: RegExp,
						handle: slime.servlet.handler
					}) => slime.servlet.handler
				}
			},
			$exports: { handle: (request: slime.servlet.Request) => slime.servlet.Response }
		}) => void
	}

	interface Tomcat {
		port: number
		map: (p: { path: string, resources: slime.Loader, servlets: { [pattern: string]: servlet }}) => void
		start: () => void
		run: () => void
	}

	interface Exports {
		Tomcat?: new () => Tomcat
	}
}