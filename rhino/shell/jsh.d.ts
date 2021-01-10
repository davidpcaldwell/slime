namespace jsh.shell {
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
			}
		}
	}

	interface Exports extends slime.jrunscript.shell.Exports {
		engine: string
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
			(p: any): any
			src?: slime.jrunscript.file.Directory
			require: (p: { satisfied: () => boolean, install: () => void }, events?: $api.Events.Function.Receiver ) => void
			lib?: slime.jrunscript.file.Directory
			home?: slime.jrunscript.file.Directory
			relaunch: () => void
			debug: any
			command: any
			url: any
		}
		os: {
			name: string
			process: {
				list: () => slime.jrunscript.shell.system.Process[]
			}
			sudo: slime.jrunscript.shell.system.Exports["sudo"]
		}
		environment: any
		HOME: slime.jrunscript.file.Directory
		PATH: any
		TMPDIR: slime.jrunscript.file.Directory
		PWD: slime.jrunscript.file.Directory
		browser: any
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
