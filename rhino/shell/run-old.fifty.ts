//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export namespace run.old {
		export type evaluate<T> = (p: run.old.Result) => T
	}

	export namespace exports {
		export interface Invocation {
			/** @deprecated */
			from: {
				/** @deprecated */
				argument: (p: invocation.Argument) => run.old.Invocation
			}

			/** @deprecated Use `from.argument`. */
			create: Invocation["from"]["argument"]

			//	TODO	probably should be conditional based on presence of sudo tool
			/**
			 * Given settings for `sudo`, converts an invocation into an equivalent invocation that will be run under `sudo`.
			 *
			 * @param settings A set of `sudo` settings.
			 * @returns An invocation that will run the given invocation under `sudo`.
			 */
			sudo: (settings: sudo.Settings) => slime.$api.fp.Transform<run.old.Invocation>

			handler: {
				stdio: {
					/**
					 * Creates an event handler that automatically buffers trailing blank lines, so that blank lines created by the
					 * end of a stream do not produce calls to the event handler.
					 */
					line: slime.$api.fp.Transform<slime.$api.event.Handler<slime.jrunscript.shell.run.Line>>
				}
			}
		}
	}

	export namespace invocation {
		export namespace old {
			/**
			 * A value that can be used as a command token. If the value is a string, it will be used as-is. If it is an object, it
			 * will be coerced to string using the String global function. Otherwise, a TypeError will be thrown.
			 */
			export type Token = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node

			export type OutputStreamToStream = slime.jrunscript.runtime.io.OutputStream
			export type OutputStreamToString = StringConstructor
			export type OutputStreamToLines = { line: (line: string) => void }
			export type OutputStreamConfiguration = OutputStreamToStream | OutputStreamToString | OutputStreamToLines

			/**
			 * Specifies the standard input, output, and error streams to use for an invocation.
			 *
			 * For the output streams:
			 * * if the global `String` object is used as the value, the stream's output will be captured as a string and returned along with the result of the subprocess.
			 * * if an object with a `line()` function is used as the value, the output will be buffered and the given object will receive a callback for each line of output.
			 *
			 * For the input stream:
			 * * if the value is a string, that string will be provided on the standard input stream for the subprocess.
			 */
			export interface Stdio {
				output?: OutputStreamConfiguration
				error?: OutputStreamConfiguration
				input?: Input
			}

			/**
			 * Type used by callers to specify {@link slime.jrunscript.shell.old.Invocation}s, without requiring boilerplate defaults; only the `command`
			 * property is required.
			 */
			export interface Argument {
				/**
				 * The command to pass to the underlying operating system.
				 */
				command: slime.jrunscript.shell.invocation.Argument["command"] | slime.jrunscript.file.Pathname | slime.jrunscript.file.File

				/**
				 * The command arguments to pass to the underlying operating system.
				 */
				arguments?: Token[]

				//	TODO	how are non-string property values handled? undefined, object, number, boolean
				/**
				 * (optional: If `null` or `undefined`, the module environment is used.) A set of names and values that will be
				 * passed to the subprocess as its environment.
				 *
				 * If an individual property in the object has the value `null`, the environment variable is omitted from the list
				 * passed to the subprocess.
				 */
				environment?: slime.jrunscript.shell.invocation.Argument["environment"]

				/**
				 * (optional) The working directory to use for the subprocess. If not specified, the working directory of the parent
				 * process will be used.
				 */
				directory?: slime.jrunscript.file.Directory

				/**
				 * The standard I/O streams to supply to the subprocess. If unspecified, or if any properties are unspecified,
				 * defaults will be used. The defaults are:
				 *
				 * * `input`: `null`
				 * * `output`: This process's standard output stream
				 * * `error`: This process's standard error stream
				 */
				stdio?: slime.jrunscript.shell.older.Invocation["stdio"]
			}
		}
	}

	export namespace run {
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

				/**
				 * @deprecated
				 *
				 * A stream to which the standard output stream of the subprocess will be written. If `null`, the output will be
				 * discarded. The default is `jsh.file.Streams.stdout`.
				 */
				stdout?: invocation.old.Argument["stdio"]["output"]

				/**
				 * @deprecated
				 *
				 * A stream that will be used as the standard input stream for the subprocess.
				 */
				stdin?: invocation.old.Argument["stdio"]["input"]

				/**
				 * @deprecated
				 *
				 * A stream to which the standard error stream of the subprocess will be written. If `null`, the output will be
				 * discarded. The default is `jsh.file.Streams.stderr`.
				 */
				stderr?: invocation.old.Argument["stdio"]["error"]
			}

			/**
			 * Information abuot a completed subprocess.
			 */
			export interface Result {
				/**
				 * The command invoked.
				 */
				command: Argument["command"]

				/**
				 * The arguments sent to the command.
				 */
				arguments: Argument["arguments"]

				environment: any

				directory: slime.jrunscript.file.Directory
				/** @deprecated */
				workingDirectory: slime.jrunscript.file.Directory

				/**
				 * The exit status of the command.
				 */
				status: number
				stdio?: run.CapturedOutput
			}

			export namespace events {
				export interface Event {
					command: slime.jrunscript.shell.invocation.old.Token
					arguments?: slime.jrunscript.shell.invocation.old.Token[]
					environment?: slime.jrunscript.shell.older.Invocation["environment"]
					directory?: slime.jrunscript.file.Directory
				}

				export interface Events {
					start: Event & {
						pid: number
						kill: () => void
					}

					terminate: Event & {
						status: number
						stdio?: slime.jrunscript.shell.run.CapturedOutput
					}
				}
			}

			export type Events = slime.$api.event.Emitter<events.Events>

			export type Handler = slime.$api.event.Handlers<events.Events>
		}
	}

	export namespace oo {
		/**
		 * Launches a subprocess using the operating system.
		 */
		export type Run<P = run.old.Argument> = {
			<T>(
				p: P & {
					evaluate: run.old.evaluate<T>
				},
				events?: run.old.Handler
			): T

			(
				p: P,
				events?: run.old.Handler
			): run.old.Result

			(p: run.old.Argument, events?: run.old.Handler): run.old.Result
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var x = fifty.global.jsh.shell.stdio;
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		run: oo.Run & {
			evaluate: any
			stdio: {
				run: (p: Parameters<slime.jrunscript.shell.Exports["run"]>[0]) => slime.jrunscript.shell.internal.run.Stdio

				/**
				 * @deprecated Better form in Invocation.handler.stdio.line, and refers to a `jsh` type from within the non-`jsh`
				 * shell module
				 *
				 * A {@link slime.jrunscript.shell.invocation.old.Stdio} implementation which buffers the output and error streams
				 * by line so they do not get mixed together (e.g., on a console).
				 *
				 * See also {@link slime.jrunscript.shell.exports.Invocation | Invocation.handler.stdio.line}, which is superior
				 * (it ignores empty lines at the end of the stream, and allows an individual stream to be buffered).
				 *
				 * @returns A `stdio` whose `output` and `error` streams buffer by line to the original `output` and `error`.
				 */
				LineBuffered: (p: { stdio: slime.jsh.shell.Exports["stdio"] }) => slime.jrunscript.shell.invocation.old.Stdio
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var getJavaProgram = function(name) {
				var jsh = fifty.global.jsh;
				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.java.tools.javac({
					destination: to.pathname,
					arguments: [fifty.jsh.file.object.getRelativePath("test/java/inonit/jsh/test/" + name + ".java")]
				});
				return {
					classpath: jsh.file.Searchpath([to.pathname]),
					main: "inonit.jsh.test." + name
				}
			};

			fifty.tests.run = function() {
				var subject: Exports = fifty.global.jsh.shell;

				var here: slime.jrunscript.file.Directory = fifty.jsh.file.object.getRelativePath(".").directory;

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
					arguments: [fifty.jsh.file.object.getRelativePath("test/java/inonit/jsh/test/Echo.java")]
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
}

namespace slime.jrunscript.shell.run.old {
	export interface Context {
		environment: slime.jrunscript.java.Environment
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
}

namespace slime.jrunscript.shell.internal.run.old {
	export interface Context {
		environment: slime.jrunscript.java.Environment
		stdio: slime.jrunscript.shell.invocation.Stdio
		api: {
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports
		}
		os: {
			name: () => string
			newline: () => string
		}
		scripts: {
			run: slime.jrunscript.shell.internal.run.Exports
		}
		module: {
			events: $api.event.Emitter<any>
		}
	}

	export interface Exports {
		run: slime.jrunscript.shell.Exports["run"]
		$run: any
		invocation: slime.jrunscript.shell.internal.invocation.Export
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.run);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
