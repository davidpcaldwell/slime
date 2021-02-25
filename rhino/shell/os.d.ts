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
		ps: {
			[os: string]: ps
		}
		sudo: sudo
		ping: any
	}

	type ps = () => slime.jrunscript.shell.system.Process[]

	type sudo = {
		//	TODO	relate below argument to module run() method, which is not yet well-defined
		(p: {
			password: string | (() => string)
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
}