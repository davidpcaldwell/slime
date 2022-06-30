//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export namespace internal.invocation.test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const code: slime.jrunscript.shell.internal.invocation.Script = fifty.$loader.script("invocation.js");
			return code();
		//@ts-ignore
		})(fifty);
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
			 * The environment to supply to the command. If `undefined`, this process's environment will be provided.
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

	export namespace exports {
		export interface Invocation {
			modernize: (p: old.Invocation) => run.Invocation
			sudo: (settings: sudo.Settings) => (invocation: run.Invocation) => run.Invocation
		}
	}

	export interface Exports {
		invocation: {
			 //	TODO	probably should be conditional based on presence of sudo tool
			 /**
			  * Given a set of `sudo` settings, provides a function that can convert an {@link Invocation} to an equivalent
			  * `Invocation` that runs the command under `sudo`.
			  */
			 sudo: (settings?: sudo.Settings) => (p: slime.jrunscript.shell.old.Invocation) => slime.jrunscript.shell.old.Invocation

			 /**
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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.invocation = {};

			fifty.tests.invocation.sudo = function() {
				var sudoed = internal.invocation.test.subject.invocation.sudo()(fifty.global.jsh.shell.Invocation.old({
					command: "ls"
				}));

				fifty.verify(sudoed).command.evaluate(String).is("sudo");
				fifty.verify(sudoed).arguments[0].is("ls");
				fifty.verify(sudoed).environment.evaluate.property("SUDO_ASKPASS").is(void(0));
			};

			fifty.tests.invocation.toBashScript = function() {
				var parent = fifty.global.jsh.shell.environment;
				fifty.verify(parent).evaluate.property("PATH").is.type("string");
				fifty.verify(parent).evaluate.property("TO_BASH_SCRIPT_EXAMPLE").is(void(0));
				var script = internal.invocation.test.subject.invocation.toBashScript()({
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
				fifty.verify(lines[2]).is("env -u PATH TO_BASH_SCRIPT_EXAMPLE=example foo bar baz");
			}
		}
	//@ts-ignore
	)(fifty);

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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const subject = internal.invocation.test.subject;

			fifty.tests.suite = function() {
				var jsh = fifty.global.jsh;
				var verify = fifty.verify;

				fifty.run(fifty.tests.invocation.sudo);

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
		run: slime.jrunscript.shell.internal.run.Exports
	}

	export type Configuration = Pick<slime.jrunscript.shell.invocation.old.Argument, "command" | "arguments">

	export type StdioWithInputFixed = {
		input: slime.jrunscript.runtime.io.InputStream
		output: slime.jrunscript.shell.invocation.old.Stdio["output"]
		error: slime.jrunscript.shell.invocation.old.Stdio["error"]
	}

	export interface Export {
		error: {
			BadCommandToken: slime.$api.error.Type<"ArgumentError",{}>
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

		modernize: slime.jrunscript.shell.exports.Invocation["modernize"]
		sudo: slime.jrunscript.shell.exports.Invocation["sudo"]

		invocation: slime.jrunscript.shell.Exports["invocation"]
	}

	export type Script = slime.loader.Script<Context,Export>
}
