//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.subprocess {
	export interface Exports {}

	export interface Exports {
		action: slime.$api.fp.world.Means<run.Intention,run.TellEvents>
		question: slime.$api.fp.world.Sensor<run.Intention,run.AskEvents,run.Exit>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			const subject = jsh.shell;

			fifty.tests.manual.subprocess = {};

			fifty.tests.manual.subprocess.question = $api.fp.impure.Process.create({
				input: $api.fp.impure.Input.map(
					$api.fp.impure.Input.value({
						command: "ls",
						stdio: {
							output: "string"
						}
					} as slime.jrunscript.shell.run.Intention),
					$api.fp.world.mapping(subject.subprocess.question)
				),
				output: $api.fp.pipe(
					$api.fp.JSON.stringify({ space: 4 }),
					jsh.shell.console
				)
			});
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.shell.context.subprocess {
	export type World = slime.$api.fp.world.Means<slime.jrunscript.shell.run.minus1.Invocation, slime.jrunscript.shell.run.TellEvents>
}

namespace slime.jrunscript.shell.internal.run {
	export interface Context {
		library: {
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports
		}

		parent: slime.$api.fp.Thunk<slime.jrunscript.shell.run.internal.Parent>

		world?: slime.jrunscript.shell.context.subprocess.World
	}

	export namespace test {
		export const subject: Exports = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("run.js");
			return script({
				library: {
					java: fifty.global.jsh.java,
					io: fifty.global.jsh.io,
					file: fifty.global.jsh.file
				},
				parent: function() {
					return {
						environment: fifty.global.jsh.shell.environment,
						stdio: fifty.global.jsh.shell.stdio,
						directory: fifty.global.jsh.shell.PWD.pathname.toString()
					}
				}
			});
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		exports: {
			subprocess: slime.jrunscript.shell.subprocess.Exports
		}

		test: {
			Invocation: {
				from: {
					intention: (parent: shell.run.internal.Parent) => (plan: shell.run.Intention) => shell.run.minus1.Invocation
				}
			}

			Parent: {
				from: {
					process: () => slime.jrunscript.shell.run.internal.Parent
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;
			const module = jsh.shell;
			const { subject } = test;

			fifty.tests.manual.Invocation = function() {
				var invocation = subject.test.Invocation.from.intention(
					subject.test.Parent.from.process()
				)({
					command: "ls"
				});
				jsh.shell.console(JSON.stringify(invocation));
			};

			fifty.tests.manual.subprocess = {};

			fifty.tests.manual.subprocess.Parent = function() {
				//	TODO	this test is basically a tautology now, testing what was passed in. What we really want to test is what
				//			module passes in for this value. Would need to wire up this test API to the (or a) module test API, and
				//			probably rename this test API to test.context.parent or something
				var parent = subject.test.Parent.from.process();
				jsh.shell.console(JSON.stringify(parent,void(0),4));
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.shell.run {
	export type OutputCapture = "string" | "line" | Omit<slime.jrunscript.runtime.io.OutputStream, "close">;

	export interface StdioConfiguration {
		input: slime.jrunscript.runtime.io.InputStream
		output: OutputCapture
		error: OutputCapture
	}

	export type Environment = {
		readonly [name: string]: string
	}

	//	Possible future representation
	// export interface Execution {
	// 	configuration: {
	// 		environment: Environment
	// 		directory: string
	// 	}

	// 	command: [string, ...string[]]

	// 	input: {
	// 		stdin: slime.jrunscript.runtime.io.InputStream
	// 	}

	// 	output: (streams: {
	// 		stdout: slime.jrunscript.runtime.io.InputStream
	// 		stderr: slime.jrunscript.runtime.io.InputStream
	// 	}) => void
	// }

	export namespace intention {
		export type Input = string | slime.jrunscript.runtime.io.InputStream
	}

	/**
	 * A specification for a potential subprocess.
	 */
	export interface Intention {
		command: string
		arguments?: string[]
		environment?: slime.$api.fp.Transform<Environment>
		directory?: string
		stdio?: {
			input?: intention.Input
			output?: StdioConfiguration["output"]
			error?: StdioConfiguration["error"]
		}
	}

	export namespace minus1 {
		export interface Invocation {
			environment: Environment
			directory: Intention["directory"]
			command: Intention["command"]
			arguments: Intention["arguments"]

			stdio: StdioConfiguration
		}
	}

	export interface Invocation {
		context: {
			environment: Environment
			directory: string
		}

		process: {
			command: string
			arguments: string[]
		}

		input: slime.jrunscript.runtime.io.InputStream


	}

	export namespace internal {
		export type SubprocessOutputStreamIdentity = "output" | "error"
		export type SubprocessOutputStreamEventType = "stdout" | "stderr"

		export interface Parent {
			environment: Environment
			directory: Intention["directory"]
			stdio: Pick<StdioConfiguration,SubprocessOutputStreamIdentity>
		}
	}

	export type Line = {
		line: string
	}

	export interface OutputEvents {
		stdout: Line
		stderr: Line
	}

	export interface AskEvents extends OutputEvents {
		start: {
			pid: number
			kill: () => void
		}
	}

	//	TODO	right now we only capture output of type string; we could capture binary also
	export interface CapturedOutput {
		/**
		 * The output of the subprocess, if it was buffered.
		 */
		output?: string

		/**
		 * The output of the subprocess that was written to the error stream, if it was buffered.
		 */
		error?: string
	}

	export interface Exit {
		status: number
		stdio?: CapturedOutput
	}

	export interface TellEvents extends AskEvents {
		exit: Exit
	}

	/**
	 * Represents the result of a mock shell invocation. Currently, if line-based output is provided for a stream, the
	 * string given as part of `exit` is ignored.
	 *
	 * @experimental
	 */
	export interface Mock {
		/**
		 * A mock PID to use; defaults to `0`.
		 */
		pid?: number

		/**
		 * Lines of output generated by the invocation. Output can also be provided for a stream by the properties of `exit.stdio`
		 * if line-based I/O is not needed (or the output is less than one line).
		 */
		lines?: ({ stdout: string } | { stderr: string })[]

		exit: {
			status: number

			/**
			 * The output for the process. Currently, if line-based output is provided for a stream, the value for that strean
			 * is ignored.
			 */
			stdio?: {
				output?: string
				error?: string
			}
		}
	}
}

namespace slime.jrunscript.shell.internal.run {
	export interface OutputDestination {
		stream: Omit<slime.jrunscript.runtime.io.OutputStream, "close">
		close: () => void
		readText?: () => string
	}

	/**
	 * A standard I/O configuration to supply to a subprocess; the subprocess will obtain its input from the given `InputStream`,
	 * and send its output and error streams to the given uncloseable output streams. The configuration also has a `close()` method
	 * which will return any output emitted which this object is configured to capture.
	 */
	export interface Stdio {
		input: slime.jrunscript.runtime.io.InputStream
		output: Omit<slime.jrunscript.runtime.io.OutputStream, "close">
		error: Omit<slime.jrunscript.runtime.io.OutputStream, "close">
		close: () => slime.jrunscript.shell.run.CapturedOutput
	}

	export interface Listener {
		close: () => void
	}

	export namespace java {
		export interface Context {
			stdio: internal.run.Stdio
			environment: slime.jrunscript.java.Environment
			directory: slime.jrunscript.file.Directory
		}

		export interface Configuration {
			command: string
			arguments: string[]
		}
	}

	export namespace test {
		export const ls: shell.run.minus2.Invocation = (function(fifty: slime.fifty.test.Kit) {
			return {
				context: {
					environment: fifty.global.jsh.shell.environment,
					directory: fifty.jsh.file.object.getRelativePath(".").toString(),
					stdio: {
						input: null,
						output: "string",
						error: fifty.global.jsh.shell.stdio.error
					}
				},
				configuration: {
					command: "ls",
					arguments: []
				}
			};
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		action: slime.jrunscript.shell.Exports["world"]["action"]
		question: slime.jrunscript.shell.Exports["world"]["question"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.question = $api.fp.pipe(
				$api.fp.world.input(
					test.subject.question(test.ls)
				),
				function(exit) {
					verify(exit).status.is(0);
					var listing = exit.stdio.output.split("\n");
					verify(listing).evaluate(function(array) { return array.indexOf("run.fifty.ts") != -1; }).is(true);
					verify(listing).evaluate(function(array) { return array.indexOf("foobar.fifty.ts") != -1; }).is(false);
				}
			)
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		run: slime.$api.fp.world.old.Action<slime.jrunscript.shell.run.minus2.Invocation,slime.jrunscript.shell.run.TellEvents>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const subject = test.subject;
			const { verify, run } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.run = function() {
				run(function() {
					var tell = subject.run(test.ls);

					tell({
						exit: function(e) {
							var listing = e.detail.stdio.output.split("\n");
							listing = listing.slice(0, listing.length-1);
							fifty.verify(e).detail.status.is(0);
							fifty.verify(listing).evaluate(function(array) { return array.indexOf("run.fifty.ts") != -1; }).is(true);
						}
					})
				});

				run(function pwdIsShellWorkingDirectoryIfUnspecified() {
					var PWD = jsh.shell.PWD.pathname.toString();
					var tell = subject.run({
						context: {
							environment: jsh.shell.environment,
							stdio: {
								input: null,
								output: "string",
								error: "line"
							},
							directory: void(0)
						},
						configuration: {
							command: "pwd",
							arguments: []
						}
					});
					tell({
						exit: function(e) {
							verify(e.detail.stdio.output).is(PWD + "\n");
						}
					});
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		internal: {
			buildStdio: slime.$api.fp.world.Sensor<
				slime.jrunscript.shell.run.StdioConfiguration,
				slime.jrunscript.shell.run.TellEvents,
				slime.jrunscript.shell.internal.run.Stdio
			>

			mock: {
				tell: shell.Exports["Tell"]["mock"]
			}
		}

		/**
		 * @deprecated Replaced by the use of the {@link Context} `spi` property, which allows a mock (or alternative)
		 * implementation to be used when executing subprocess invocations.
		 */
		mock: shell.Exports["world"]["mock"]

		/**
		 * @deprecated
		 */
		old: {
			/**
			 * @deprecated
			 */
			run: (
				context: slime.jrunscript.shell.run.minus2.Context,
				configuration: slime.jrunscript.shell.run.minus2.Configuration,
				module: {
					events: any
				},
				events: slime.jrunscript.shell.run.minus2.Events,
				p: slime.jrunscript.shell.run.minus2.Argument,
				invocation: slime.jrunscript.shell.run.minus2.Argument,
				isLineListener: (p: slime.jrunscript.shell.invocation.old.OutputStreamConfiguration) => p is slime.jrunscript.shell.invocation.old.OutputStreamToLines
			) => slime.jrunscript.shell.run.Exit
		}
	}

	export type Script = slime.loader.Script<Context,Exports>

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.question);
				fifty.run(fifty.tests.run);
			}
		}
	//@ts-ignore
	)(fifty);
}
