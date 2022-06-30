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
		stdio: {
			output: string
		}
	}

	export interface Context {
		stdio: Stdio
		_environment: slime.jrunscript.native.inonit.system.OperatingSystem.Environment
		_properties: slime.jrunscript.native.java.util.Properties
		kotlin: {
			compiler: slime.jrunscript.file.File
		}
		api: {
			js: slime.js.old.Exports
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports

			document: any
			httpd: any
			xml: any
		}
		world?: {
			run?: slime.jrunscript.shell.run.World
		}
	}

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		listeners: $api.Events<{
			"run.start": any
		}>["listeners"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.listeners = function() {
				const jsh = fifty.global.jsh;

				var subject: Exports = jsh.shell;

				var command = jsh.shell.PATH.getCommand("true");

				var log = (function() {
					var events = [];
					var listener: $api.event.Handler<any> = function(e) {
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
			fifty: slime.fifty.test.Kit
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

	export interface World {
	}

	export interface Exports {
		//	environment (maybe defined erroneously in jsh.d.ts)

		//	listeners
	}

	export namespace run {
		export type OutputCapture = "string" | "line" | slime.jrunscript.runtime.io.OutputStream;

		export interface StdioConfiguration {
			input: slime.jrunscript.runtime.io.InputStream
			output: OutputCapture
			error: OutputCapture
		}

		export interface Context {
			environment: slime.jrunscript.host.Environment
			directory: string
			stdio: StdioConfiguration
		}

		export interface Configuration {
			command: string
			arguments: string[]
		}

		export interface Invocation {
			context: Context
			configuration: Configuration
		}

		export namespace old {
			export interface Argument extends invocation.old.Argument {
				as?: {
					user: string
				}

				on?: {
					start: (data: old.events.Events["start"]) => void
				}

				/** @deprecated */
				tokens?: any
				/** @deprecated */
				workingDirectory?: slime.jrunscript.file.Directory
				/** @deprecated */
				stdout?: invocation.old.Argument["stdio"]["output"]
				/** @deprecated */
				stdin?: invocation.old.Argument["stdio"]["input"]
				/** @deprecated */
				stderr?: invocation.old.Argument["stdio"]["error"]
			}

			export interface Result {
				command: any
				arguments: any[]
				environment: any

				directory: slime.jrunscript.file.Directory
				/** @deprecated */
				workingDirectory: slime.jrunscript.file.Directory

				status: number
				stdio?: run.Output
			}

			export namespace events {
				export interface Event {
					command: slime.jrunscript.shell.invocation.Token
					arguments?: slime.jrunscript.shell.invocation.Token[]
					environment?: slime.jrunscript.shell.old.Invocation["environment"]
					directory?: slime.jrunscript.file.Directory
				}

				export interface Events {
					start: Event & {
						pid: number
						kill: () => void
					}

					terminate: Event & {
						status: number
						stdio?: slime.jrunscript.shell.run.Output
					}
				}
			}

			export type Events = slime.$api.Events<events.Events>

			export type Handler = slime.$api.events.Handler<events.Events>
		}
	}

	export interface Exports {
		/**
		 * Launches a Java program.
		 */
		java: {
			//	TODO	The old comment stated that this argument was the same as the argument to `shell`, with classpath, jar, and
			//			main added. This seems likely to be wrong but looking at the implementation may reveal whether the types
			//			are related in the implementation.
			/**
			 * Launches a Java program.
			 */
			<R>(p: {
				vmarguments?: any
				properties?: any

				/**
				 * The classpath to pass to the Java process.
				 */
				classpath: slime.jrunscript.file.Searchpath

				/**
				 * The name of the main class to execute.
				 */
				main: string

				arguments?: any
				environment?: any
				stdio?: any
				directory?: any
				evaluate: (result: Result) => R
			}): R

			/**
			 * Launches a Java program.
			 */
			(p: {
				vmarguments?: any
				properties?: any
				classpath: any
				main: any
				arguments?: any
				environment?: any
				stdio?: any
				directory?: any
			}): Result

			/**
			 * Launches a Java program.
			 */
			(p: {
				vmarguments?: any
				properties?: any

				/**
				 * A JAR file to pass to `java -jar`.
				 */
				jar: slime.jrunscript.file.File
				arguments?: any
				stdio: any
				evaluate: any
			}): Result

			version: string

			keytool: any

			/**
			 * The Java launcher program, that is, the executable used to launch Java programs.
			 */
			launcher: slime.jrunscript.file.File

			jrunscript: any

			/**
			 * The home directory of the Java installation used to run this shell.
			 */
			home: slime.jrunscript.file.Directory
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const subject = jsh.shell;

			fifty.tests.exports.java = function() {
				debugger;
				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.java.tools.javac({
					destination: to.pathname,
					arguments: [fifty.jsh.file.object.getRelativePath("test/java/inonit/jsh/test/Program.java")]
				});
				var buffer = new jsh.io.Buffer();
				var output = subject.java({
					classpath: jsh.file.Searchpath([to.pathname]),
					main: "inonit.jsh.test.Program",
					stdio: {
						output: buffer.writeBinary()
					},
					evaluate: function(result) {
						buffer.close();
						return buffer.readText().asString();
					}
				});
				verify(output).is("Hello");

				verify(subject).java.home.is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		//	TODO	probably should be conditional based on presence of sudo tool
		/**
		 * Creates an object that can execute invocations under `sudo` using the settings given.
		 */
		sudo: (settings?: Parameters<Exports["invocation"]["sudo"]>[0]) => {
			run: (invocation: invocation.old.Argument) => any
		}

		//	fires started, exception, stdout, stderr
		/**
		 * Provides a framework for embedding processes inside a shell. Invokes the given method with the given argument
		 */
		embed: (p: {
			method: Function
			argument: object
			started: (p: { output?: string, error?: string }) => boolean
		}, events: $api.events.Function.Receiver) => void

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
		PATH?: slime.jrunscript.file.Searchpath

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

			//	TODO	should not be using internal types
			ping?: slime.jrunscript.shell.internal.os.Exports["ping"]

			//	TODO	should not depend on jsh; need to disentangle jsh["ui"] from jsh first and have a separate TypeScript
			//			definition for something like slime.jrunscript.ui or something
			inject: (dependencies: { ui: slime.jsh.Global["ui"] }) => void
		}

		user: {
			downloads?: slime.jrunscript.file.Directory
		}

		//	browser

		system: any

		jrunscript: any

		kotlin: any

		/** @deprecated Presently unused. */
		rhino: any

		world: World
	}

	export type Script = slime.loader.Script<Context,Exports>;

	export namespace sudo {
		export interface Settings {
			nocache?: boolean
			askpass?: string | slime.jrunscript.file.File
		}
	}

	export namespace exports {
		export interface Invocation {
			create: (p: invocation.Argument) => run.Invocation

			/**
			 * @deprecated
			 *
			 * Creates a fully-specified {@link old.Invocation} from a given {@link invocation.old.Argument} and the surrounding context.
			 */
			old: (p: invocation.old.Argument) => old.Invocation

			stdio: {
				handler: {
					line: (f: (e: slime.$api.Event<slime.jrunscript.shell.run.Line>) => void) => (e: slime.$api.Event<slime.jrunscript.shell.run.Line>) => void
				}
			}
		}
	}

	export interface Exports {
		Invocation: exports.Invocation
	}

	export interface World {
		/**
		 * @deprecated Replaced by the {@link Context} `world.run` property, which allows a mock implementation to be used when
		 * loading the module. A mock implementation is provided in {@link slime.jrunscript.shell.test.Fixtures}.
		 *
		 * Allows a mock implementation of the `run` action to be created using a function that receives an invocation as an
		 * argument and returns an object describing what the mocked subprocess should do. The system will use this object to create
		 * the appropriate `Tell` and fire the appropriate events to the caller.
		 */
		mock: (delegate: (invocation: shell.run.Invocation) => shell.run.Mock) => slime.$api.fp.impure.Action<run.Invocation,run.TellEvents>

		 /** @deprecated Replaced by {@link Exports | Exports Invocation.create()} because it does not rely on external state. */
		Invocation: (p: invocation.old.Argument) => old.Invocation
	}

	export interface Exports {
		Tell: {
			exit: () => (tell: slime.$api.fp.impure.Tell<run.TellEvents>) => run.TellEvents["exit"]
			mock: (stdio: Partial<Pick<slime.jrunscript.shell.run.StdioConfiguration,"output" | "error">>, result: slime.jrunscript.shell.run.Mock) => slime.$api.fp.impure.Tell<slime.jrunscript.shell.run.TellEvents>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.exports.Tell = function() {
				var tell: slime.$api.fp.impure.Tell<run.TellEvents> = jsh.shell.Tell.mock({
					output: "string"
				}, {
					exit: {
						status: 0,
						stdio: {
							output: "foobar"
						}
					}
				})

				var interpret = function(result: run.TellEvents["exit"]): string {
					return result.stdio.output + result.stdio.output;
				};

				var exit = jsh.shell.Tell.exit();
				var result = $api.Function.result(exit(tell), interpret);
				verify(result).is("foobarfoobar");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace internal.module {
		export type Invocation = {
			configuration: internal.run.java.Configuration
			result: {
				command: string | slime.jrunscript.file.Pathname | slime.jrunscript.file.File
				arguments: slime.jrunscript.shell.invocation.Token[]
				as: Parameters<Exports["run"]>[0]["as"]
			}
		}
	}

	(
		function(fifty: slime.fifty.test.Kit) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.listeners);
				fifty.run(fifty.tests.environment);

				fifty.run(fifty.tests.exports.Tell);
				fifty.load("invocation.fifty.ts");
				fifty.load("run.fifty.ts");
				fifty.load("run-old.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty)
}
