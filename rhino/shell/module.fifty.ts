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
			arguments?: any
			environment?: any
			stdio?: any
			directory?: any
			evaluate?: any
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

	export interface World {
	}

	export interface Exports {
		//	environment (maybe defined erroneously in jsh.d.ts)

		//	listeners
	}

	export namespace run {
		//	TODO	right now we only capture output of type string; we could capture binary also
		export interface Output {
			output?: string
			error?: string
		}

		export type OutputCapture = "string" | "line" | slime.jrunscript.runtime.io.OutputStream;

		export type Line = {
			line: string
		}

		export interface Events {
			start: {
				pid: number
				kill: () => void
			}

			stdout: Line

			stderr: Line

			exit: {
				status: number
				stdio?: slime.jrunscript.shell.run.Output
			}
		}

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
		run: {
			<T>(
				p: run.old.Argument & {
					evaluate?: (p: run.old.Result) => T
				},
				events?: run.old.Handler
			): T

			(p: run.old.Argument, events?: run.old.Events): run.old.Result

			evaluate: any
			stdio: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var getJavaProgram = function(name) {
				var jsh = fifty.global.jsh;
				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.java.tools.javac({
					destination: to.pathname,
					arguments: [fifty.$loader.getRelativePath("test/java/inonit/jsh/test/" + name + ".java")]
				});
				return {
					classpath: jsh.file.Searchpath([to.pathname]),
					main: "inonit.jsh.test." + name
				}
			};

			fifty.tests.run = function() {
				var subject: Exports = fifty.global.jsh.shell;

				var here: slime.jrunscript.file.Directory = fifty.$loader.getRelativePath(".").directory;

				var on = {
					start: void(0)
				}

				var argument: slime.jrunscript.shell.run.old.Argument = {
					command: "ls",
					directory: here,
					on: {
						start: function(target) {
							on.start = target;
						}
					}
				};

				var captured: run.old.events.Events = {
					start: void(0),
					terminate: void(0)
				};

				var events = {
					start: function(e) {
						fifty.global.jsh.shell.console("start!");
						captured.start = e.detail;
					},
					terminate: function(e) {
						fifty.global.jsh.shell.console("terminate!");
						captured.terminate = e.detail;
					}
				};

				fifty.verify(on).start.is.type("undefined");

				subject.run(argument, events);

				//	TODO	appears to work in latest version of TypeScript
				//@ts-ignore
				fifty.verify(captured).start.command.evaluate(function(p) { return String(p) }).is("ls");
				fifty.verify(captured).start.directory.evaluate(function(directory) { return directory.toString(); }).is(here.toString());
				fifty.verify(captured).start.pid.is.type("number");
				fifty.verify(captured).start.kill.is.type("function");

				fifty.verify(captured).terminate.status.is(0);

				fifty.verify(on).start.is.type("object");

				fifty.run(function argumentChecking() {
					fifty.verify(subject).evaluate(function() {
						this.run({
							command: null
						})
					}).threw.message.is("property 'command' must not be null; full invocation = (null)");
					fifty.verify(subject).evaluate(function() {
						this.run({
							command: "java",
							arguments: [null]
						})
					}).threw.message.is("property 'arguments[0]' must not be null; full invocation = java (null)");
				});

				fifty.run(fifty.tests.run.stdio);

				fifty.run(function directory() {
					var jsh = fifty.global.jsh;
					var module = subject;

					var program = getJavaProgram("Directory");
					var dir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var result = module.java({
						classpath: program.classpath,
						main: program.main,
						stdio: {
							output: String
						},
						directory: dir
					});
					var workdir = result.stdio.output;
					fifty.verify(workdir).is(dir.toString());
				})
			}
			fifty.tests.run.stdio = function() {
				var subject: Exports = fifty.global.jsh.shell;
				var jsh = fifty.global.jsh;
				var module = subject;
				var verify = fifty.verify;

				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.java.tools.javac({
					destination: to.pathname,
					arguments: [fifty.$loader.getRelativePath("test/java/inonit/jsh/test/Echo.java")]
				});
				var result = module.java({
					classpath: jsh.file.Searchpath([to.pathname]),
					main: "inonit.jsh.test.Echo",
					stdio: {
						input: "Hello, World!",
						output: String
					}
				});
				verify(result).stdio.output.is("Hello, World!");

				var runLines = function(input) {
					var buffered = [];
					var rv = module.java({
						classpath: jsh.file.Searchpath([to.pathname]),
						main: "inonit.jsh.test.Echo",
						stdio: {
							input: input,
							output: {
								line: function(string) {
									buffered.push(string);
								}
							}
						}
					});
					return {
						stdio: {
							output: buffered
						}
					};
				};

				var lines: { stdio: { output: string[] }};
				var nl = jsh.shell.os.newline;
				lines = runLines("Hello, World!" + nl + "Line 2");
				verify(lines).stdio.output.length.is(2);
				verify(lines).stdio.output[0].is("Hello, World!");
				verify(lines).stdio.output[1].is("Line 2");
				lines = runLines("Hello, World!" + nl + "Line 2" + nl);
				verify(lines).stdio.output.length.is(3);
				verify(lines).stdio.output[0].is("Hello, World!");
				verify(lines).stdio.output[1].is("Line 2");
				verify(lines).stdio.output[2].is("");
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

		world: World
	}

	export type Loader = slime.loader.Script<Context,Exports>;

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
		}
	}

	export interface Exports {
		Invocation: exports.Invocation
	}

	export interface World {
		run: (invocation: run.Invocation) => slime.$api.fp.impure.Tell<run.Events>

		/**
		 * Allows a mock implementation of `run` to be created using a function that receives an invocation as an argument
		 * and returns an object describing what the mocked subprocess should do. The system will use this object to create
		 * the appropriate `Tell` and fire the appropriate events to the caller.
		 */
		mock: (delegate: (invocation: shell.run.Invocation) => shell.run.Mock) => World["run"]

		 /** @deprecated Replaced by {@link Exports | Exports Invocation.create()} because it does not rely on external state. */
		Invocation: (p: invocation.old.Argument) => old.Invocation
	}

	(
		function(
			$api: slime.$api.Global,
			fifty: slime.fifty.test.kit
		) {
			const subject = fifty.global.jsh.shell;

			fifty.tests.world = function() {
				var directory = fifty.$loader.getRelativePath(".").directory;

				if (fifty.global.jsh.shell.PATH.getCommand("ls")) {
					var ls = subject.Invocation.create({
						command: "ls",
						directory: directory,
						stdio: {
							output: "line",
							error: "line"
						}
					});
					var tell = subject.world.run(ls);
					var captor = fifty.$api.Events.Captor({
						start: void(0),
						stdout: void(0),
						stderr: void(0),
						exit: void(0)
					});
					tell(captor.handler);
					fifty.global.jsh.shell.console(JSON.stringify(captor.events,void(0),4));

					var killed = subject.Invocation.create({
						command: "sleep",
						arguments: ["1"],
						directory: directory,
						stdio: {
							output: "line",
							error: "line"
						}
					});
					var events = [];
					var subprocess;
					var killtell = subject.world.run(killed);
					killtell({
						start: function(e) {
							events.push(e);
							subprocess = e.detail;
							subprocess.kill();
						},
						stdout: function(e) {
							events.push(e);
						},
						stderr: function(e) {
							events.push(e);
						},
						exit: function(e) {
							events.push(e);
						}
					});
					fifty.global.jsh.shell.console(JSON.stringify(events,void(0),4));
				}
			}

			fifty.tests.sandbox = function() {
				var bogus = subject.Invocation.create({
					command: "foobarbaz"
				});

				(function() {
					var tell = subject.world.run(bogus);
					fifty.verify(tell).evaluate(function(f) { return f(); }).threw.type(Error);
					fifty.verify(tell).evaluate(function(f) { return f(); }).threw.name.is("JavaException");
				})();

				var directory = fifty.$loader.getRelativePath(".").directory;

				if (fifty.global.jsh.shell.PATH.getCommand("ls")) {
					var ls = subject.Invocation.create({
						command: "ls",
						directory: directory
					});
					var status: number;
					subject.world.run(ls)({
						exit: function(e) {
							status = e.detail.status;
						}
					});
					fifty.verify(status).is(0);

					var lsIllegalArgumentStatus = (function() {
						if (fifty.global.jsh.shell.os.name == "Mac OS X") return 1;
						if (fifty.global.jsh.shell.os.name == "Linux") return 2;
					})();

					fifty.run(function checkExitStatus() {
						debugger;
						var lserror = $api.Object.compose(ls, {
							configuration: $api.Object.compose(ls.configuration, {
								arguments: ["--foo"]
							})
						});
						var status: number;
						subject.world.run(lserror)({
							exit: function(e) {
								status = e.detail.status;
							}
						});
						fifty.verify(status).is(lsIllegalArgumentStatus);
					});

					fifty.run(function checkErrorOnNonZero() {
						var lserror = $api.Object.compose(ls, {
							configuration: $api.Object.compose(ls.configuration, {
								arguments: ["--foo"]
							})
						});
						var tell = subject.world.run(lserror);
						//	TODO	this listener functionality was previously provided by default; will want to improve API over
						//			time so that it's harder to accidentally ignore non-zero exit status
						var listener: slime.$api.events.Handler<slime.jrunscript.shell.run.Events> = {
							exit: function(e) {
								if (e.detail.status != 0) {
									throw new Error("Non-zero exit status: " + e.detail.status);
								}
							}
						}
						fifty.verify(tell).evaluate(function(f) { return f(listener); }).threw.type(Error);
						fifty.verify(tell).evaluate(function(f) { return f(listener); }).threw.message.is("Non-zero exit status: " + lsIllegalArgumentStatus);
					});
				}

				var isDirectory = function(directory) {
					return Object.assign(function(p) {
						return directory.toString() == p.toString();
					}, {
						toString: function() {
							return "is directory " + directory;
						}
					})
				};

				var it = {
					is: function(value) {
						return function(p) {
							return p === value;
						}
					}
				}

				fifty.run(function Invocation() {
					var directory = fifty.$loader.getRelativePath(".").directory;

					//	TODO	test for missing command

					fifty.run(function defaults() {
						var argument: invocation.Argument = {
							command: "ls"
						};
						var invocation = fifty.global.jsh.shell.Invocation.create(argument);
						fifty.verify(invocation, "invocation", function(its) {
							its.configuration.command.is("ls");
							its.configuration.arguments.is.type("object");
							its.configuration.arguments.length.is(0);
							//	TODO	environment
							its.context.directory.evaluate(isDirectory(fifty.global.jsh.shell.PWD)).is(true);
							its.context.stdio.input.evaluate(it.is(null)).is(true);
							//	TODO	appears to work in latest TypeScript
							//@ts-ignore
							its.context.stdio.output.evaluate(it.is(fifty.global.jsh.shell.stdio.output)).is(true);
							//	TODO	appears to work in latest TypeScript
							//@ts-ignore
							its.context.stdio.error.evaluate(it.is(fifty.global.jsh.shell.stdio.error)).is(true);
						});
					});

					fifty.run(function specified() {
						var argument: invocation.Argument = {
							command: fifty.global.jsh.file.Pathname("/bin/ls"),
							arguments: [directory.getRelativePath("invocation.fifty.ts")],
							//	TODO	environment
							directory: directory
						};
						var invocation = fifty.global.jsh.shell.Invocation.create(argument);
						fifty.verify(invocation, "invocation", function(its) {
							its.configuration.command.is("/bin/ls");
							its.configuration.arguments.is.type("object");
							its.configuration.arguments.length.is(1);
							its.configuration.arguments[0].is(directory.getRelativePath("invocation.fifty.ts").toString());
							its.context.directory.evaluate(isDirectory(directory)).is(true);
						});
					});
				});
			}
		}
	//@ts-ignore
	)($api,fifty);

	export interface Exports {
		Tell: {
			exit: () => (tell: slime.$api.fp.impure.Tell<run.Events>) => (run.Events["exit"])
			mock: (stdio: Partial<Pick<slime.jrunscript.shell.run.StdioConfiguration,"output" | "error">>, result: slime.jrunscript.shell.run.Mock) => slime.$api.fp.impure.Tell<slime.jrunscript.shell.run.Events>
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.exports = {};

			fifty.tests.exports.Tell = function() {
				var tell: slime.$api.fp.impure.Tell<run.Events> = jsh.shell.Tell.mock({
					output: "string"
				}, {
					exit: {
						status: 0,
						stdio: {
							output: "foobar"
						}
					}
				})

				var interpret = function(result: run.Events["exit"]): string {
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
		function(fifty: slime.fifty.test.kit) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.listeners);
				fifty.run(fifty.tests.environment);

				fifty.run(fifty.tests.exports.Tell);
				fifty.load("invocation.fifty.ts");

				fifty.run(fifty.tests.sandbox);
			}
		}
	//@ts-ignore
	)(fifty)
}