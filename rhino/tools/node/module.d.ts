namespace slime.jrunscript.node {
	interface Context {
		module: {
			file: any,
			shell: any
		},
		library: {
			install: any
		}
	}

	interface Version {
		number: string
	}

	interface Installation {
		version: Version
		run: Function
		modules: {
			installed: { [key: string]: object },
			install: Function,
			require: Function,
			uninstall: Function
		},
		npm: {
			run: (p: {
				command: string
				global?: boolean
				arguments?: string[]
				stdio?: any
				directory?: slime.jrunscript.file.Directory
			}) => any
		}
	}

	interface Exports {
		Installation: new (o: any) => slime.jrunscript.node.Installation
		at: Function
		Project: Function,
		install: (
			p: {
				location: slime.jrunscript.file.Pathname,
				version?: string,
				update?: boolean
			},
			events?: any
		) => slime.jrunscript.node.Installation
	}
}