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
			ui: any
		}
	}

	export interface Exports {
		listeners: $api.Events<{
			"run.start": any
		}>["listeners"]
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.listeners = function() {
				const jsh = fifty.global.jsh;

				var subject: Exports = jsh.shell;

				var command = jsh.shell.PATH.getCommand("true");

				var log = (function() {
					var events = [];
					var listener: $api.Event.Handler<any> = function(e) {
						events.push(e);
					};
					return {
						listener: listener,
						captured: function() {
							return events;
						}
					}
				})();

				subject.listeners.add("run.start", log.listener);

				fifty.verify(log).captured().length.is(0);

				subject.run({
					command: command
				});

				fifty.verify(log).captured().length.is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * An object representing the environment provided via the {@link Context}, or representing the system environment if
		 * no environment was provided via the `Context`.
		 */
		environment: slime.jrunscript.host.Environment
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.environment = function() {
				const jsh = fifty.global.jsh;

				var fixtures: Packages.inonit.system.test.Fixtures = fifty.$loader.file("../../rhino/system/test/system.fixtures.ts");
				var o = fixtures.OperatingSystem.Environment.create({
					values: { foo: "bazz" },
					caseSensitive: true
				});
				fifty.verify(String(o.getValue("foo"))).is("bazz");

				var module: Exports = fifty.$loader.module("module.js", {
					_environment: o,
					api: {
						java: jsh.java,
						io: jsh.io,
						file: jsh.file,
						js: jsh.js
					}
				});
				fifty.verify(module).environment.evaluate.property("foo").is("bazz");
				fifty.verify(module).environment.evaluate.property("xxx").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
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

			/**
			 * Returns the value of the specified system property, or `null` if it does not have a value.
			 *
			 * @param name
			 */
			get(name: string): string

			file(name: any): any
			directory(name: any): any
			searchpath(name: any): any
		}

		system: any
		rhino: any
		kotlin: any
	}

	export type Loader = slime.Loader.Product<Context,Exports>;

	(
		function(fifty: slime.fifty.test.kit) {
			fifty.tests.suite = function() {
				run(fifty.tests.listeners);
				run(fifty.tests.environment);
			}
		}
	//@ts-ignore
	)(fifty)
}