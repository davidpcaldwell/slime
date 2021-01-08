namespace slime.jrunscript.shell {
	interface Stdio {
		input?: any
		output?: any
		error?: any
	}

	interface Result {
	}

	interface java {
		(p: {
			vmarguments: any
			properties: any
			jar: any
			main: any
			arguments: any
		}): Result

		version: string

		keytool: any

		launcher: slime.jrunscript.file.File

		jrunscript: any
		home: any
	}

	interface Context {
		_environment: any
		_properties: any
		kotlin: any
		api: {
			js: any
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports

			document: any
			httpd: any
			xml: any
		}
	}

	interface Exports {
		//	fires started, exception, stdout, stderr
		embed: (p: {
			method: Function
			argument: object
			started: (p: { output?: string, error?: string }) => boolean
		}, events: $api.Events.Function.Receiver) => void

		user: {
			downloads?: slime.jrunscript.file.Directory
		}

		java: java

		PATH?: any

		run?: any

		os: {
			name: any
			version: any
			newline: any
		}

		listeners: $api.Events["listeners"]

		TMPDIR: slime.jrunscript.file.Directory
		USER: slime.jrunscript.file.Directory
		HOME: slime.jrunscript.file.Directory
		PWD: slime.jrunscript.file.Directory

		jrunscript: any
		properties: any
		stdio: any
		system: any
		rhino: any
		kotlin: any

		environment: any
	}
}