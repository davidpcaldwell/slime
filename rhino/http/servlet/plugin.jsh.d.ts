namespace jsh.httpd {
	namespace servlet {
		type byLoad = { load: (scope: slime.servlet.Scope) => void }
		type byFile = { file: slime.jrunscript.file.File }
		type byResource = { resource: string }

		type descriptor = (byLoad | byFile | byResource) & {
			parameters?: Parameters
		}

		type Parameters = { [name: string]: any }
	}

	interface Tomcat {
		base: slime.jrunscript.file.Directory

		port: number

		https: {
			port: number
		}

		map: (p: {
			path: string,
			resources?: slime.Loader,
			servlets?: { [pattern: string]: servlet.descriptor }
			webapp?: any
		}) => void

		servlet: (servlet: servlet.descriptor & { resources?: slime.Loader }) => void

		start: () => void

		run: () => void

		stop: () => void
	}

	interface Resources {
		file: any
		add: (m: { directory?: slime.jrunscript.file.Directory, loader?: slime.Loader, prefix: string }) => void
		loader: any
	}

	interface Exports {
		nugget: any
		spi: {
			argument: (resources: slime.Loader, servlet: any) => {
				resources: slime.Loader,
				load: (scope: object) => void,
				$loader?: slime.Loader
			}
		}
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