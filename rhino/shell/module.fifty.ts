//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export interface Stdio {
		input?: slime.jrunscript.runtime.io.InputStream
		output?: slime.jrunscript.runtime.io.OutputStream
		error?: slime.jrunscript.runtime.io.OutputStream
	}

	interface Result {
	}

	interface java {
		(p: {
			vmarguments?: any
			properties?: any
			jar: any
			arguments: any
		}): Result

		(p: {
			vmarguments?: any
			properties?: any
			classpath: any
			main: any
			arguments: any
			environment: any
		}): Result

		version: string

		keytool: any

		launcher: slime.jrunscript.file.File

		jrunscript: any
		home: any
	}

	export interface Context {
		stdio: Stdio
		_environment: slime.jrunscript.native.inonit.system.OperatingSystem.Environment
		_properties: slime.jrunscript.native.java.util.Properties
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

				var fixtures: slime.jrunscript.native.inonit.system.test.Fixtures = fifty.$loader.file("../../rhino/system/test/system.fixtures.ts");
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

	type Token = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node

	/**
	 * A fully-specified invocation of a command to be run in an external process.
	 */
	export interface Invocation {
		/**
		 * The command to run.
		 */
		command: Token

		/**
		 * The arguments to pass to the command.
		 */
		arguments: Token[] | ( (args: Token[]) => void )

		/**
		 * The environment to pass to the command.
		 */
		environment: {
			[name: string]: string
		}

		/**
		 * The working directory to use when running the command.
		 */
		directory: slime.jrunscript.file.Directory

		/**
		 * The standard input, output, and error streams to use for the command.
		 *
		 * For the output streams:
		 * * if the global `String` object is used as the value, the stream's output will be captured as a string and returned along with the result of the subprocess.
		 * * if an object with a `line()` function is used as the value, the output will be buffered and the given object will receive a callback for each line of output.
		 *
		 * For the input stream:
		 * * if the value is a string, that string will be provided on the standard input stream for the subprocess.
		 */
		stdio: {
			output?: StringConstructor | slime.jrunscript.runtime.io.OutputStream | { line: (line: string) => void }
			error?: StringConstructor | slime.jrunscript.runtime.io.OutputStream | { line: (line: string) => void }
			input?: string | slime.jrunscript.runtime.io.InputStream
		}
	}

	export namespace invocation {
		/**
		 * Type used by callers to specify {@link Invocation}s, without requiring boilerplate defaults; only the `command`
		 * property is required.
		 */
		export interface Argument {
			command: Invocation["command"]
			arguments?: Invocation["arguments"]
			environment?: Invocation["environment"]
			directory?: Invocation["directory"]
			stdio?: Invocation["stdio"]
		}
	}

	export interface Exports {
		//	environment (maybe defined erroneously in jsh.d.ts)

		/**
		 * Creates a fully-specified {@link Invocation} from a given {@link invocation.Argument}.
		 */
		Invocation: (p: invocation.Argument) => Invocation

		invocation: {
			//	TODO	probably should be conditional based on presence of sudo tool
			/**
			 * Given a set of `sudo` settings, provides a function that can convert an {@link Invocation} to an equivalent
			 * `Invocation` that runs the command under `sudo`.
			 */
			sudo: (settings?: {
				nocache?: boolean
				askpass?: string | slime.jrunscript.file.File
			}) => (p: Invocation) => Invocation
		}

		//	listeners
		run: {
			(p: invocation.Argument & {
				as?: any
				tokens?: any
				on?: any
				workingDirectory?: any
				stdout?: any
				stdin?: any
				stderr?: any
				evaluate?: (p: any) => any
			}, events?: any): any

			evaluate: any
			stdio: any
		}

		//	TODO	probably should be conditional based on presence of sudo tool
		/**
		 * Executes a given invocation under `sudo` according to the settings given.
		 */
		sudo: (settings?: Parameters<Exports["invocation"]["sudo"]>[0]) => {
			run: (invocation: invocation.Argument) => any
		}

		//	fires started, exception, stdout, stderr
		/**
		 * Provides a framework for embedding processes inside a shell. Invokes the given method with the given argument
		 */
		embed: (p: {
			method: Function
			argument: object
			started: (p: { output?: string, error?: string }) => boolean
		}, events: $api.Events.Function.Receiver) => void

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

		TMPDIR: slime.jrunscript.file.Directory
		USER: string
		HOME: slime.jrunscript.file.Directory

		PWD: slime.jrunscript.file.Directory
		PATH?: any

		os: {
			name: string
			arch: string
			version: string
			newline: string
			resolve: any
			process?: {
				list: slime.jrunscript.shell.system.ps
			}
			sudo?: slime.jrunscript.shell.system.sudo
			ping?: slime.jrunscript.shell.system.Exports["ping"]

			//	TODO	should not depend on jsh; need to disentangle jsh["ui"] from jsh first and have a separate TypeScript
			//			definition for something like slime.jrunscript.ui or something
			inject: (dependencies: { ui: slime.jsh.Global["ui"] }) => void
		}

		user: {
			downloads?: slime.jrunscript.file.Directory
		}

		//	browser

		system: any

		java: java

		jrunscript: any

		kotlin: any

		/** @deprecated Presently unused. */
		rhino: any
	}

	export type Loader = slime.loader.Product<Context,Exports>;

	(
		function(fifty: slime.fifty.test.kit) {
			fifty.tests.suite = function() {
				run(fifty.tests.listeners);
				run(fifty.tests.environment);

				fifty.load("invocation.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty)
}