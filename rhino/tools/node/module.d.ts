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
		run: <T>(p: {
			command?: string
			project?: slime.jrunscript.file.Directory
			arguments?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["arguments"]
			directory?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["directory"]
			environment?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["environment"]
			stdio?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["stdio"]
			evaluate?: (p: any) => T
		}) => T
		modules: {
			installed: { [key: string]: { version: string } },
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
				evaluate?: any
				directory?: slime.jrunscript.file.Directory
			}) => any
		}
	}

	interface Exports {
		Installation: new (o: any) => slime.jrunscript.node.Installation
		at: (p: { location: slime.jrunscript.file.Pathname }) => slime.jrunscript.node.Installation
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