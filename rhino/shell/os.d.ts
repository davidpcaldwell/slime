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
		api: {
			js: any,
			file: any,
			io: any
		}
		environment: any
		TMPDIR: slime.jrunscript.file.Directory
		PATH: any
		replacePath: any
	}

	type ps = () => slime.jrunscript.shell.system.Process[]

	type sudo = {
		//	TODO	relate below argument to module run() method
		(p: {
			password: string | (() => string)
			command: string
			arguments?: string[]
			stdio?: any
			evaluate?: any
		}): void

		initialize: (p: string) => void

		PasswordRequired: slime.$api.Error.Type<Error>
		PasswordIncorrect: slime.$api.Error.Type<Error>

		gui?: (p?: { prompt: string }) => () => string

		desktop?: (p: { askpass: { author: any, prompt: any, force: any }, arguments: any, stdio: any, command: any }) => any
	}

	interface Exports {
		ps: {
			[os: string]: ps
		}
		sudo: sudo
		ping: any
		desktop: (library: jsh["ui"]) => void
	}
}