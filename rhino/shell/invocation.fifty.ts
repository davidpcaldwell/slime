//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export namespace old {
		/**
		 * A fully-specified invocation of a command to be run in an external process.
		 */
		export interface Invocation {
			/**
			 * The command to run.
			 */
			command: string

			/**
			 * The arguments to pass to the command.
			 */
			arguments: string[]

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

			stdio: invocation.old.Stdio
		}
	}

	export namespace invocation {
		export type Token = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node

		export type Input = string | slime.jrunscript.runtime.io.InputStream

		export namespace old {
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
			 * Type used by callers to specify {@link Invocation}s, without requiring boilerplate defaults; only the `command`
			 * property is required.
			 */
			export interface Argument {
				command: slime.jrunscript.shell.invocation.Argument["command"]
				arguments?: slime.jrunscript.shell.invocation.Argument["arguments"]
				environment?: slime.jrunscript.shell.invocation.Argument["environment"]
				directory?: slime.jrunscript.file.Directory

				/**
				 * The standard I/O streams to supply to the subprocess. If unspecified, or if any properties are unspecified,
				 * defaults will be used. The defaults are:
				 *
				 * * `input`: `null`
				 * * `output`: This process's standard output stream
				 * * `error`: This process's standard error stream
				 */
				stdio?: slime.jrunscript.shell.old.Invocation["stdio"]
			}
		}

		export interface Argument {
			/**
			 * The command to run.
			 */
			command: string | slime.jrunscript.file.Pathname | slime.jrunscript.file.File

			/**
			 * The arguments to supply to the command. If not present, an empty array will be supplied.
			 */
			arguments?: Token[]

			/**
			 * The environment to supply to the command. If not specified, this process's environment will be provided.
			 */
			environment?: slime.jrunscript.shell.old.Invocation["environment"]

			/**
			 * The working directory in which the command will be executed. If not specified, this process's working directory
			 * will be provided.
			 */
			directory?: string

			stdio?: {
				input?: Input
				output?: slime.jrunscript.shell.run.OutputCapture
				error?: slime.jrunscript.shell.run.OutputCapture
			}
		 }
	}

	export interface Exports {
		invocation: {
			 //	TODO	probably should be conditional based on presence of sudo tool
			 /**
			  * Given a set of `sudo` settings, provides a function that can convert an {@link Invocation} to an equivalent
			  * `Invocation` that runs the command under `sudo`.
			  */
			 sudo: (settings?: {
				 nocache?: boolean
				 askpass?: string | slime.jrunscript.file.File
			 }) => (p: slime.jrunscript.shell.old.Invocation) => slime.jrunscript.shell.old.Invocation

			 toBashScript: () => (p: {
				command: string | slime.jrunscript.file.File
				arguments?: string[]
				directory?: slime.jrunscript.file.Directory
			 }) => string
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const code: slime.jrunscript.shell.internal.invocation.Factory = fifty.$loader.factory("invocation.js");

			const subject: slime.jrunscript.shell.internal.invocation.Export = code();

			fifty.tests.suite = function() {
				var jsh = fifty.global.jsh;
				var verify = fifty.verify;

				fifty.run(function() {
					var sudoed = subject.invocation.sudo()(jsh.shell.Invocation.old({
						command: "ls"
					}));

					verify(sudoed).command.evaluate(String).is("sudo");
					verify(sudoed).arguments[0].is("ls");
					verify(sudoed).environment.evaluate.property("SUDO_ASKPASS").is(void(0));
				});

				fifty.run(function askpass() {
					var sudoed = subject.invocation.sudo({
						askpass: "/path/to/askpass"
					})(jsh.shell.Invocation.old({
						command: "ls"
					}));

					verify(sudoed).command.evaluate(String).is("sudo");
					verify(sudoed).arguments[0].is("--askpass");
					verify(sudoed).arguments[1].is("ls");
					verify(sudoed).environment.SUDO_ASKPASS.is("/path/to/askpass");
				});
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.shell.internal.invocation {
	export interface Context {
		library: {
			io: slime.jrunscript.io.Exports
		}
		run: slime.jrunscript.shell.internal.run.Export
	}

	export type Configuration = Pick<slime.jrunscript.shell.invocation.old.Argument, "command" | "arguments">

	export type StdioWithInputFixed = {
		input: slime.jrunscript.runtime.io.InputStream
		output: slime.jrunscript.shell.invocation.old.Stdio["output"]
		error: slime.jrunscript.shell.invocation.old.Stdio["error"]
	}

	export interface Export {
		error: {
			BadCommandToken: slime.$api.Error.Type<TypeError>
		}

		toInputStream: (p: slime.jrunscript.shell.invocation.Input) => slime.jrunscript.runtime.io.InputStream

		updateForStringInput: (p: slime.jrunscript.shell.invocation.old.Stdio) => slime.jrunscript.shell.internal.invocation.StdioWithInputFixed

		fallbackToParentStdio: (
			p: slime.jrunscript.shell.internal.invocation.StdioWithInputFixed,
			parent: slime.jrunscript.shell.Stdio
		) => void

		toStdioConfiguration: (declaration: slime.jrunscript.shell.internal.invocation.StdioWithInputFixed) => slime.jrunscript.shell.run.StdioConfiguration

		toContext: (
			p: slime.jrunscript.shell.invocation.old.Argument,
			parentEnvironment: slime.jrunscript.host.Environment,
			parentStdio: slime.jrunscript.shell.Stdio
		) => slime.jrunscript.shell.run.Context

		isLineListener: (p: slime.jrunscript.shell.invocation.old.OutputStreamConfiguration) => p is slime.jrunscript.shell.invocation.old.OutputStreamToLines

		toConfiguration: (
			p: Configuration
		) => slime.jrunscript.shell.internal.run.java.Configuration

		invocation: slime.jrunscript.shell.Exports["invocation"]
	}

	export type Factory = slime.loader.Product<Context,Export>
}
