namespace jsh.httpd {
	interface servlet {
		parameters?: ({ [name: string]: any })
		file?: slime.jrunscript.file.File
		resource?: string
		load: (scope: slime.servlet.Scope) => void
	}

	interface Tomcat {
		port: number
		map: (p: { path: string, resources: slime.Loader, servlets: { [pattern: string]: servlet }}) => void
		start: () => void
		run: () => void
		stop: () => void
	}

	interface Resources {
		file: any
	}

	interface Exports {
		Resources: new () => Resources
		Tomcat?: new (p?: { port?: number }) => Tomcat
		plugin: {
			tools: () => void
		}
		tools: {
			build: {
				(p: {

				}): void

				getJavaSourceFiles: (p: any) => any[]
			}
		}
	}
}