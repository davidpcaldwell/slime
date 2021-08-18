//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
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

		stdio: invocation.Stdio
	}

	export namespace invocation {
		export type Token = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node

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
			output?: StringConstructor | slime.jrunscript.runtime.io.OutputStream | { line: (line: string) => void }
			error?: StringConstructor | slime.jrunscript.runtime.io.OutputStream | { line: (line: string) => void }
			input?: string | slime.jrunscript.runtime.io.InputStream
		}

		/**
		 * Type used by callers to specify {@link Invocation}s, without requiring boilerplate defaults; only the `command`
		 * property is required.
		 */
		export interface Argument {
			/**
			 * The command to run.
			 */
			command: Token
			/**
			 * The arguments to supply to the command. If not present, an empty array will be supplied.
			 */
			arguments?: Token[]
			/**
			 * The environment to supply to the command. If not specified, this process's environment will be provided.
			 */
			environment?: Invocation["environment"]
			/**
			 * The working directory in which the command will be executed. If not specified, this process's working directory
			 * will be provided.
			 */
			directory?: Invocation["directory"]
			/**
			 * The standard I/O streams to supply to the subprocess. If unspecified, or if any properties are unspecified,
			 * defaults will be used. The defaults are:
			 *
			 * * `input`: `null`
			 * * `output`: This process's standard output stream
			 * * `error`: This process's standard error stream
			 */
			stdio?: Invocation["stdio"]
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
			 }) => (p: Invocation) => Invocation
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
					var sudoed = subject.invocation.sudo()(jsh.shell.Invocation({
						command: "ls"
					}));

					verify(sudoed).command.evaluate(String).is("sudo");
					verify(sudoed).arguments[0].is("ls");
					verify(sudoed).environment.evaluate.property("SUDO_ASKPASS").is(void(0));
				});

				fifty.run(function askpass() {
					var sudoed = subject.invocation.sudo({
						askpass: "/path/to/askpass"
					})(jsh.shell.Invocation({
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
	export interface Export {
		invocation: slime.jrunscript.shell.Exports["invocation"]

		stdio: {
			/**
			 * Returns the `stdio` property of the argument, synthesizing it from deprecated arguments if necessary, and returning
			 * an empty object if nothing is specified.
			 */
			forModuleRunArgument: (p: Parameters<slime.jrunscript.shell.Exports["run"]>[0]) => Parameters<slime.jrunscript.shell.Exports["run"]>[0]["stdio"]
		}

		directory: {
			forModuleRunArgument: (p: Parameters<slime.jrunscript.shell.Exports["run"]>[0]) => slime.jrunscript.file.Directory
		}
	}

	export type Factory = slime.loader.Product<Context,Export>
}
