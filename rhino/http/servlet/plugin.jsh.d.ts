namespace slime.jsh.httpd {
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

		/**
		 * Configures the given servlet as a single top-level servlet in this Tomcat server.
		 */
		servlet: (servlet: servlet.descriptor & { resources?: slime.Loader }) => void

		start: () => void

		run: () => void

		stop: () => void
	}

	namespace Tomcat {
		interface Configuration {
			/**
			 * The port on which the server's HTTP service should run; if omitted, an ephemeral port will be used.
			 */
			port?: number

			/**
			 * The base directory against which the server should run; if omitted, a temporary directory will be used.
			 */
			base?: slime.jrunscript.file.Directory

			https?: {
				port: number
			}
		}
	}

	interface Exports {
		nugget: any
		spi: {
			argument: (resources: slime.Loader, servlet: jsh.httpd.servlet.descriptor) => {
				resources: slime.Loader,
				load: servlet.byLoad["load"],
				$loader?: slime.Loader
			}
		}
		Resources: slime.jsh.httpd.resources.Export
		Tomcat?: {
			new (p?: Tomcat.Configuration): Tomcat

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