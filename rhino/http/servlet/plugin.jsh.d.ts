namespace jsh.httpd {
	interface servlet {
		parameters?: ({ [name: string]: any })
		file?: slime.jrunscript.file.File
		resource?: string
		load: (scope: slime.servlet.Scope) => void
	}

	interface Tomcat {
		base: slime.jrunscript.file.Directory
		port: number

		map: (p: {
			path: string,
			resources?: slime.Loader,
			servlets: { [pattern: string]: servlet }
		}) => void

		https: any

		servlet: any

		start: () => void

		run: () => void

		stop: () => void
	}

	interface Resources {
		file: any
		add: any
		loader: any
	}

	interface Exports {
		nugget: any
		spi: any
		Resources: {
			new (): Resources
			Old: any
			NoVcsDirectory: any
			script: any
		}
		Tomcat?: {
			new (p?: { port?: number, base?: slime.jrunscript.file.Directory, https?: { port: number } }): Tomcat
			serve: any
		}
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