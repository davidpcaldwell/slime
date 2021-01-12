namespace slime.jrunscript.shell {
	interface Stdio {
		input?: slime.jrunscript.runtime.io.InputStream
		output?: slime.jrunscript.runtime.io.OutputStream
		error?: slime.jrunscript.runtime.io.OutputStream
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

	export interface Context {
		stdio: Stdio
		_environment: Packages.inonit.system.OperatingSystem.Environment
		_properties: Packages.java.util.Properties
		kotlin: {
			compiler: slime.jrunscript.file.File
		}
		api: {
			js: slime.runtime.old.Exports
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports

			document: any
			httpd: any
			xml: any
		}
	}

	export interface Exports {
		listeners: $api.Events["listeners"]

		environment: any

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

		TMPDIR: slime.jrunscript.file.Directory
		USER: string
		HOME: slime.jrunscript.file.Directory
		PWD: slime.jrunscript.file.Directory

		jrunscript: any
		properties: {
			object: any
			get(name: string): string
			file(name: any): any
			directory(name: any): any
			searchpath(name: any): any
		}
		system: any
		rhino: any
		kotlin: any
	}

	export type Loader = slime.Loader.Product<Context,Exports>

	(
		function(fifty: slime.fifty.test.kit) {
			fifty.tests.suite = function() {
				fifty.verify(1).is(1);
			}
		}
	//@ts-ignore
	)(fifty)
}