namespace slime.jrunscript.shell.system {
	interface Process {
		id: number
		parent: Process
		command: string
		children: Process[]
		kill: () => void
	}

	interface Context {
		run: any
		os: any
		api: { js: any, file: any, io: any, ui: any }
		environment: any
		TMPDIR: slime.jrunscript.file.Directory
		PATH: any
		replacePath: any
	}

	interface Exports {
		ps: any
		sudo: {
			//	TODO	relate below argument to module run() method, which is not yet well-defined
			(p: {
				password: string | sudo.getPassword
				command: string
				arguments?: string[]
				stdio?: any
				evaluate?: any
			}): void
			initialize: Function
			desktop: any
			PasswordRequired: new (string) => Error
			PasswordIncorrect: new (string) => Error
		}
		ping: any
	}

	namespace sudo {
		type getPassword = () => string
	}
}