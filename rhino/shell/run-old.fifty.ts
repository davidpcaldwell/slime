//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace internal.invocation {
		export interface Context {
			library: {
				io: slime.jrunscript.io.Exports
			}
		}

		export type Configuration = Pick<slime.jrunscript.shell.invocation.old.Argument, "command" | "arguments">

		export type StdioWithInputFixed = {
			input: slime.jrunscript.runtime.io.InputStream
			output: slime.jrunscript.shell.invocation.old.Stdio["output"]
			error: slime.jrunscript.shell.invocation.old.Stdio["error"]
		}

		export interface Export {
			exports: (defaults: shell.run.internal.Parent) => slime.jrunscript.shell.exports.Invocation

			internal: {
				/**
				 * Interface that is exposed because the old `run` interface uses it; see `run-old.js`.
				 */
				old: {
					error: {
						BadCommandToken: slime.$api.error.old.Type<"ArgumentError",{}>
					}

					parseCommandToken: {
						(arg: slime.jrunscript.shell.invocation.old.Token, index?: number, ...args: any[]): string;
						Error: slime.$api.error.old.Type<"ArgumentError", {}>;
					}
				}
			}

			invocation: slime.jrunscript.shell.Exports["invocation"]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api } = fifty.global;
				const subject = fifty.global.jsh.shell;

				var directory = fifty.jsh.file.object.getRelativePath(".").directory;

				fifty.tests.manual.kill = function() {
					if (fifty.global.jsh.shell.PATH.getCommand("sleep")) {
						var killed = subject.Invocation.from.argument({
							command: "sleep",
							arguments: ["1"],
							directory: directory.toString(),
							stdio: {
								output: "line",
								error: "line"
							}
						});
						var events = [];
						var subprocess;
						var killtell = subject.world.action(killed);
						$api.fp.world.now.tell(
							killtell,
							{
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
							}
						);
						fifty.global.jsh.shell.console(JSON.stringify(events,void(0),4));
					}
				}
			}
		//@ts-ignore
		)(fifty);

		export type Script = slime.loader.Script<Context,Export>
	}

	export interface Exports {
		/** @deprecated See properties for replacements. */
		invocation: {
			 /**
			  * @deprecated Replaced by {@link Exports.bash bash.from.intention()}.
			  *
			  * Creates the code for a `bash` script from a single Invocation-like object and returns it as a string.
			  */
			 toBashScript: () => (p: {
				/**
				 * The command to execute.
				 */
				command: string | slime.jrunscript.file.File

				/**
				 * Arguments to be sent to the command. If omitted, no arguments will be sent.
				 */
				arguments?: string[]

				/**
				 * The working directory to be used when executing the command. If omitted, the shell's current working directory
				 * will be used.
				 */
				directory?: string | slime.jrunscript.file.Directory

				/**
				 * Configuration of the environment for the command. If omitted, the command will inherit the environment of the
				 * invoking shell.
				 */
				environment?: {
					/**
					 * Whether to include the environment of the invoking shell. If `true`, the command's environment will include
					 * the environment of the invoking shell. Defaults to `true`.
					 */
					inherit?: boolean

					/**
					 * Environment variables to be provided to the command, or to be removed from the environment of the command.
					 * Properties with string values represent variables to be provided to the command (potentially overriding
					 * values from the parent shell). Properties with `null` values represent variables to be **removed** from
					 * the command's environment (even if they are present in the parent shell). Properties that are undefined
					 * will have no effect.
					 */
					values: {
						[x: string]: string | null
					}
				}
			 }) => string
		}
	}

	export namespace internal.run.old {
		export interface Exports {
			invocation: slime.jrunscript.shell.internal.invocation.Export
		}
	}

	export interface Exports {
		test: {
			invocation: slime.jrunscript.shell.internal.invocation.Export
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const subject: slime.jrunscript.shell.internal.invocation.Export = fifty.global.jsh.shell.test.invocation;

			fifty.tests.invocation = fifty.test.Parent();

			fifty.tests.invocation.sudo = function() {
				var sudoed = subject.exports(void(0)).sudo({})(fifty.global.jsh.shell.Invocation.from.argument({
					command: "ls"
				}));

				fifty.verify(sudoed).configuration.command.evaluate(String).is("sudo");
				fifty.verify(sudoed).configuration.arguments[0].is("ls");
				fifty.verify(sudoed).context.environment.evaluate.property("SUDO_ASKPASS").is(void(0));
			};

			fifty.tests.invocation.toBashScript = function() {
				var parent = fifty.global.jsh.shell.environment;
				fifty.verify(parent).evaluate.property("PATH").is.type("string");
				fifty.verify(parent).evaluate.property("TO_BASH_SCRIPT_EXAMPLE").is(void(0));
				var script = subject.invocation.toBashScript()({
					command: "foo",
					arguments: ["bar", "baz"],
					directory: "/path/to/use",
					environment: {
						values: {
							PATH: null,
							TO_BASH_SCRIPT_EXAMPLE: "example"
						}
					}
				});
				var lines = script.split("\n");
				fifty.verify(lines[0]).is("#!/bin/bash");
				fifty.verify(lines[1]).is("cd /path/to/use");
				fifty.verify(lines[2]).is("env -u PATH TO_BASH_SCRIPT_EXAMPLE=\"example\" foo bar baz");
			}

			fifty.tests.invocation.suite = function() {
				fifty.run(function askpass() {
					var sudoed = subject.exports(void(0)).sudo({
						askpass: "/path/to/askpass"
					})(jsh.shell.Invocation.from.argument({
						command: "ls"
					}));

					verify(sudoed).configuration.command.evaluate(String).is("sudo");
					verify(sudoed).configuration.arguments[0].is("--askpass");
					verify(sudoed).configuration.arguments[1].is("ls");
					verify(sudoed).context.environment.SUDO_ASKPASS.is("/path/to/askpass");
				});
			}

			fifty.tests.invocation.migrated = fifty.test.Parent();

			fifty.tests.invocation.migrated.other = function() {
				const { $api, jsh } = fifty.global;
				const subject = fifty.global.jsh.shell;

				fifty.run(function checkErrorForBogusInvocation() {
					var bogus = subject.Invocation.from.argument({
						command: "foobarbaz"
					});

					var tell = subject.world.action(bogus);
					fifty.verify(tell).evaluate(function(f) { return $api.fp.world.now.tell(f); }).threw.type(Error);
					fifty.verify(tell).evaluate(function(f) { return $api.fp.world.now.tell(f); }).threw.evaluate.property("name").is("JavaException");
				});

				var directory = fifty.jsh.file.object.getRelativePath(".").directory;

				if (fifty.global.jsh.shell.PATH.getCommand("ls")) {
					var ls = subject.Invocation.from.argument({
						command: "ls",
						directory: directory.toString()
					});
					var status: number;
					$api.fp.world.now.tell(
						subject.world.action(ls),
						{
							exit: function(e) {
								status = e.detail.status;
							}
						}
					);
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
						$api.fp.world.now.tell(
							subject.world.action(lserror),
							{
								exit: function(e) {
									status = e.detail.status;
								}
							}
						);
						fifty.verify(status).is(lsIllegalArgumentStatus);
					});

					fifty.run(function checkErrorOnNonZero() {
						var lserror = $api.Object.compose(ls, {
							configuration: $api.Object.compose(ls.configuration, {
								arguments: ["--foo"]
							})
						});
						var tell = subject.world.action(lserror);
						//	TODO	this listener functionality was previously provided by default; will want to improve API over
						//			time so that it's harder to accidentally ignore non-zero exit status
						var listener: slime.$api.event.Handlers<slime.jrunscript.shell.run.TellEvents> = {
							exit: function(e) {
								if (e.detail.status != 0) {
									throw new Error("Non-zero exit status: " + e.detail.status);
								}
							}
						}
						fifty.verify(tell).evaluate(function(f) { return $api.fp.world.now.tell(f, listener); }).threw.type(Error);
						fifty.verify(tell).evaluate(function(f) { return $api.fp.world.now.tell(f, listener); }).threw.message.is("Non-zero exit status: " + lsIllegalArgumentStatus);
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
					var directory = fifty.jsh.file.object.getRelativePath(".").directory;

					//	TODO	test for missing command

					fifty.run(function defaults() {
						var argument: shell.invocation.Argument = {
							command: "ls"
						};
						var invocation = fifty.global.jsh.shell.Invocation.from.argument(argument);
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
						var argument: shell.invocation.Argument = {
							command: fifty.global.jsh.file.Pathname("/bin/ls").toString(),
							arguments: [directory.getRelativePath("run.fifty.ts").toString()],
							//	TODO	environment
							directory: directory.toString()
						};
						var invocation = fifty.global.jsh.shell.Invocation.from.argument(argument);
						fifty.verify(invocation, "invocation", function(its) {
							its.configuration.command.is("/bin/ls");
							its.configuration.arguments.is.type("object");
							its.configuration.arguments.length.is(1);
							its.configuration.arguments[0].is(directory.getRelativePath("run.fifty.ts").toString());
							its.context.directory.evaluate(isDirectory(directory)).is(true);
						});
					});
				});
			};

			fifty.tests.invocation.migrated.subprocess = function() {
				const { $api } = fifty.global;
				const subject = fifty.global.jsh.shell;
				const directory = fifty.jsh.file.object.getRelativePath(".").directory;

				const console = fifty.global.jsh.shell.console;

				var ls = subject.Invocation.from.argument({
					command: "ls",
					directory: directory.toString(),
					stdio: {
						output: "line",
						error: "line"
					}
				});

				var tell = subject.world.action(ls);

				var captor = fifty.$api.Events.Captor({
					start: void(0),
					exit: void(0),
					stdout: void(0),
					stderr: void(0)
				} as slime.jrunscript.shell.run.TellEvents)

				$api.fp.world.now.tell(
					tell,
					captor.handler
				);

				var isType: (type: string) => slime.$api.fp.Predicate<slime.$api.Event<any>> = function(type) {
					return function(event: slime.$api.Event<any>) {
						return event.type == type;
					}
				};

				var ofType: (type: string) => (events: slime.$api.Event<any>[]) => slime.$api.Event<any>[] = function(type) {
					return function(events) {
						return events.filter(isType(type));
					}
				}

				//	TODO	this is not necessarily true at the moment, given the implementation
				//verify(captor).events[0].type.is("start");
				verify(captor).events.evaluate(ofType("start")).length.is(1);

				verify(captor).events.evaluate(ofType("stdout")).evaluate(function(stdout) {
					return stdout.length > 0;
				}).is(true);

				verify(captor).events.evaluate(ofType("stderr")).length.is(1);
				verify(captor).events.evaluate(ofType("stderr"))[0].evaluate(function(event) {
					return event.detail.line == "";
				}).is(true);

				verify(captor).events[captor.events.length-1].type.is("exit");
				verify(captor).events.evaluate(ofType("exit")).length.is(1);

				captor.events.forEach(function(event) {
					console(JSON.stringify(event));
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace run.old {
		/**
		 * A function that will be invoked when the subprocess terminates, will be provided with information about the result, and
		 * specifies the return value of `run`.
		 *
		 * If this property is omitted, a default will be used that throws an exception if the exit status of the subprocess is not
		 * zero or the subprocess cannot be launched, and returns its argument.
		 *
		 * @returns An arbitrary value to return as the return value of the subprocess.
		 */
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

	export namespace parent {
		export interface Stdio {
			input?: slime.jrunscript.runtime.io.InputStream
			output?: Omit<slime.jrunscript.runtime.io.OutputStream, "close">
			error?: Omit<slime.jrunscript.runtime.io.OutputStream, "close">
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
				/**
				 * The standard output stream (`stdout`).
				 */
				output?: OutputStreamConfiguration

				/**
				 * The standard error stream (`stderr`).
				 */
				error?: OutputStreamConfiguration

				/**
				 * The standard input stream (`stdin`) **or** a string that will be translated to bytes and supplied to the process as input.
				 */
				input?: slime.jrunscript.shell.run.intention.Input
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
				 *
				 * Alternatively, the code allows the use of a {@link slime.$api.fp.old.Mutator}, which is invoked with a copy of
				 * the parent environment as an argument, though the type definition does not allow this sort of argument and it is
				 * unclear whether it is used.
				 */
				environment?: slime.jrunscript.shell.invocation.Argument["environment"]

				/**
				 * (optional) The working directory to use for the subprocess. If not specified, the working directory of the parent
				 * process will be used.
				 */
				directory?: slime.jrunscript.file.Directory

				/**
				 * The standard I/O streams to supply to the subprocess.
				 *
				 * If the value is `null` the subprocess will receive empty input and all output will be discarded. Otherwise, the
				 * properties of the given object are interpreted for each stream as specified below.
				 *
				 * * `input`:
				 *     * If omitted or `null`, an empty stream is supplied as input.
				 *     * If a string, the string is supplied as input.
				 *     * If a {@link slime.jrunscript.runtime.io.InputStream}, the stream is supplied as input.
				 * * `output`:
				 *     * If `null`, a stream that discards all output is supplied to the subprocess.
				 *     * If the `String` global function is supplied, subprocess output is buffered and converted to a string and is
				 * returned as the `output` property of the `stdio` property of the result of the subprocess.
				 *     * If a {@link slime.jrunscript.runtime.io.OutputStream}, output from the subprocess is sent to that stream.
				 * * `error`: See `output` for how values are interpreted (if the output is buffered and returned, it will be the
				 * `error` property of the `stdio` property of the result).
				 *
				 * If unspecified, or if any properties are unspecified, defaults will be used, which will in part by supplied by
				 * the {@link slime.jrunscript.shell.context.Stdio | "parent"} supplied as part of the module {@link
				 * slime.jrunscript.shell.Context}. The defaults are:
				 *
				 * * `input`: `null`
				 * * `output`: The parent's output stream
				 * * `error`: The parent's error stream
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
				 * The command that was run.
				 */
				command: Argument["command"]

				/**
				 * The arguments that were passed to the command.
				 */
				arguments: Argument["arguments"]

				/**
				 * The environment that was passed to the program, if any.
				 */
				environment?: object

				/**
				 * The working directory that was specified for running the program, if any.
				 */
				directory?: slime.jrunscript.file.Directory
				/** @deprecated */
				workingDirectory: slime.jrunscript.file.Directory

				/**
				 * The exit status of the subprocess, if it was launched successfully.
				 */
				status: number

				/**
				 * The output of the subprocess, if the caller specified that it should be buffered and returned.
				 */
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
					/**
					 * Invoked when a process starts.
					 */
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
		 *
		 * @returns The value returned by the function given as the `evaluate` property of the argument, or by the default
		 * implementation of `evaluate`.
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

				//	TODO	probably should get rid of this style now and replace with fifty.test.Parent() construct
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
					fifty.verify(workdir).is(String(dir.pathname.java.adapt().getCanonicalPath()));
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

	export namespace sudo {
		export interface Settings {
			nocache?: boolean
			askpass?: string | slime.jrunscript.file.File
		}
	}
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
		stdio: slime.jrunscript.shell.parent.Stdio
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
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.invocation);
				fifty.run(fifty.tests.run);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
