namespace jsh.shell {
	interface Exports {
		engine: string
		//	TODO	run.evaluate.wrap
		exit: (code: number) => void
		stdio: any
		echo: Function
		console: (message: string) => void
		//	TODO	shell?
		rhino: any
		jsh: ((p: any) => any) & {
			src?: slime.jrunscript.file.Directory
			require: (p: { satisfied: () => boolean, install: () => void }, events?: $api.Events.Function.Receiver ) => void
			lib?: slime.jrunscript.file.Directory
			home?: slime.jrunscript.file.Directory
		}
		os: {
			name: string
			process: {
				list: () => slime.jrunscript.shell.system.Process[]
			}
			sudo: slime.jrunscript.shell.system.Exports["sudo"]
		}
		environment: any
		run: Function & { stdio: any }
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
		},
		tools: jsh.shell.tools.Exports
	}
}
