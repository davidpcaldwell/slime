namespace slime.jsh.shell {
	namespace internal {
		interface Context {
			exit: any
			stdio: any
			_getSystemProperties: any
			jsh: any
			api: {
				js: any
				java: slime.jrunscript.host.Exports
				io: slime.jrunscript.io.Exports
				file: slime.jrunscript.file.Exports
				script: jsh.script.Exports
			}
		}
	}

	type Argument = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node | slime.jrunscript.file.File | slime.jrunscript.file.Directory

	interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * The JavaScript engine executing the loader process for the shell, e.g., `rhino`, `nashorn`.
		 */
		engine: string

		run: slime.jrunscript.shell.Exports["run"] & {
			evaluate: {
				wrap: any
				jsh: {
					wrap: any
				}
			}
		}

		//	TODO	run.evaluate.wrap
		exit: (code: number) => void
		stdio: any
		echo: {
			(message: any, mode?: any): void
			String: any
		}
		console: (message: string) => void
		//	TODO	shell?
		rhino: any
		shell: any
		jsh: {
			(p: {
				shell?: slime.jrunscript.file.Directory
				script: slime.jrunscript.file.File
				fork?: boolean
				evaluate?: (p: any) => any
				arguments?: Argument[]
				environment?: any
				stdio?: any
				directory?: any
				workingDirectory?: any
				properties?: { [x: string]: string }
			}): any
			src?: slime.jrunscript.file.Directory
			require: (p: { satisfied: () => boolean, install: () => void }, events?: $api.Events.Function.Receiver ) => void
			lib?: slime.jrunscript.file.Directory
			home?: slime.jrunscript.file.Directory
			relaunch: () => void
			debug: any
			command: any
			url: any
		}
		environment: any
		HOME: slime.jrunscript.file.Directory
		PATH: any
		TMPDIR: slime.jrunscript.file.Directory
		PWD: slime.jrunscript.file.Directory
		browser: slime.jrunscript.shell.browser.Exports
		listeners: any
		system: {
			apple: {
				plist: {
					xml: {
						encode: Function
						decode: Function
					}
				}
			}
			opendesktop: any
		},
		tools: jsh.shell.tools.Exports
	}
}
