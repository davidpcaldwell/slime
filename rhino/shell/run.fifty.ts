//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.internal.run {
	export interface Context {
		api: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}
	}

	export interface Result {
		status: number
		stdio: slime.jrunscript.shell.run.Output
	}

	export type OutputCapture = "string" | "line" | slime.jrunscript.runtime.io.OutputStream;

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

	export interface StdioConfiguration {
		input: slime.jrunscript.runtime.io.InputStream
		output: OutputCapture
		error: OutputCapture
	}

	export type Line = {
		line: string
	}

	export interface Listener {
		close: () => void
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

	export namespace subprocess {
		export interface Context {
			environment: slime.jrunscript.host.Environment
			directory: slime.jrunscript.file.Directory
			stdio: StdioConfiguration
		}

		export interface Configuration {
			command: string
			arguments: string[]
		}
	}

	export interface Export {
		run: (
			context: subprocess.Context,
			configuration: subprocess.Configuration
		) => slime.$api.fp.impure.Tell<slime.jrunscript.shell.internal.run.Events>


		old: {
			buildStdio: (p: StdioConfiguration) => (events: slime.$api.Events<Events>) => Stdio
			run: (
				context: subprocess.Context,
				configuration: subprocess.Configuration,
				module: {
					events: any
				},
				events: slime.jrunscript.shell.run.old.Events,
				p: slime.jrunscript.shell.run.old.Argument,
				invocation: slime.jrunscript.shell.run.old.Argument,
				isLineListener: (p: slime.jrunscript.shell.invocation.OutputStreamConfiguration) => p is slime.jrunscript.shell.invocation.OutputStreamToLines
			) => Result
		}
	}

	export type Factory = slime.loader.Product<Context,Export>
}
