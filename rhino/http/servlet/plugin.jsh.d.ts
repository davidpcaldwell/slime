namespace jsh.httpd {
	interface servlet {
		parameters?: ({ [name: string]: any })
		file?: slime.jrunscript.file.File
		resource?: string
		//	TODO	below scope is incomplete
		load: (scope: { $exports: { handle: Function } }) => void
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