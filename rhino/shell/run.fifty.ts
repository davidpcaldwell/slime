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

	export interface SubprocessContext {
		environment: slime.jrunscript.host.Environment
		directory: slime.jrunscript.file.Directory
		stdio: StdioConfiguration
	}

	export interface Export {
		run: (
			context: SubprocessContext,
			configuration: slime.jrunscript.shell.internal.run.java.Configuration
		) => slime.$api.fp.impure.Tell<slime.jrunscript.shell.internal.run.Events>

		old: {
			run: (
				context: SubprocessContext,
				configuration: slime.jrunscript.shell.internal.run.java.Configuration,
				module: {
					events: any
				},
				events: slime.jrunscript.shell.run.old.Events,
				p: slime.jrunscript.shell.run.old.Argument,
				invocation: slime.jrunscript.shell.run.old.Argument
			) => Result
		}

		buildStdio: (p: {
			input: slime.jrunscript.runtime.io.InputStream
			output?: slime.jrunscript.shell.invocation.Stdio["output"]
			error?: slime.jrunscript.shell.invocation.Stdio["error"]
		}) => (events: slime.$api.Events<Events>) => Stdio

		toStdioConfiguration: (p: Parameters<slime.jrunscript.shell.internal.run.Export["buildStdio"]>[0]) => StdioConfiguration
	}

	export type Factory = slime.loader.Product<Context,Export>
}
