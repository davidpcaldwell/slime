//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.run {
	export interface Mock {
		pid?: number
		lines?: ({ stdout: string } | { stderr: string })[]
		exit: {
			status: number
			stdio: {
				output?: string
				error?: string
			}
		}
	}
}

namespace slime.jrunscript.shell.internal.run {
	export interface Context {
		api: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports
		}
	}

	export interface Result {
		status: number
		stdio: slime.jrunscript.shell.run.Output
	}

	export interface OutputDestination {
		stream: slime.jrunscript.runtime.io.OutputStream
		close: () => void
		readText?: () => string
	}

	/**
	 * Extends the standard shell `Stdio` type to make all fields required and add a `close()` method that closes the streams and
	 * returns the output of the program.
	 */
	export type Stdio = Required<slime.jrunscript.shell.Stdio> & { close: () => slime.jrunscript.shell.run.Output }

	export interface Listener {
		close: () => void
	}

	export namespace java {
		export interface Context {
			stdio: internal.run.Stdio
			environment: slime.jrunscript.host.Environment
			directory: slime.jrunscript.file.Directory
		}

		export interface Configuration {
			command: string
			arguments: string[]
		}
	}

	export interface Export {
		run: shell.World["run"]

		/**
		 * Allows a mock implementation of `run` to be created using a function that receives an invocation as an argument
		 * and returns an object describing what the mocked subprocess should do. The system will use this object to create
		 * the appropriate `Tell` and fire the appropriate events to the caller.
		 */
		mock: shell.World["mock"]

		old: {
			buildStdio: (p: slime.jrunscript.shell.run.StdioConfiguration) => (events: slime.$api.Events<slime.jrunscript.shell.run.Events>) => Stdio
			run: (
				context: slime.jrunscript.shell.run.Context,
				configuration: slime.jrunscript.shell.run.Configuration,
				module: {
					events: any
				},
				events: slime.jrunscript.shell.run.old.Events,
				p: slime.jrunscript.shell.run.old.Argument,
				invocation: slime.jrunscript.shell.run.old.Argument,
				isLineListener: (p: slime.jrunscript.shell.invocation.old.OutputStreamConfiguration) => p is slime.jrunscript.shell.invocation.old.OutputStreamToLines
			) => Result
		}
	}

	export type Factory = slime.loader.Script<Context,Export>

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var loader: Factory = fifty.$loader.script("run.js");
			var subject: Export = loader({
				api: {
					java: fifty.global.jsh.java,
					io: fifty.global.jsh.io,
					file: fifty.global.jsh.file
				}
			});

			fifty.tests.suite = function() {
				var tell = subject.run({
					context: {
						environment: fifty.global.jsh.shell.environment,
						directory: fifty.$loader.getRelativePath(".").directory,
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
				});
				tell({
					exit: function(e) {
						var listing = e.detail.stdio.output.split("\n");
						listing = listing.slice(0, listing.length-1);
						fifty.verify(e).detail.status.is(0);
						fifty.verify(listing).evaluate(function(array) { return array.indexOf("run.fifty.ts") != -1; }).is(true);
					}
				})
			}
		}
	//@ts-ignore
	)(fifty);
}

