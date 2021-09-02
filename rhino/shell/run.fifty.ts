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
		stdio: slime.jrunscript.shell.run.Stdio
	}

	export interface Buffer {
		stream: slime.jrunscript.runtime.io.OutputStream
		close: () => void
		readText: () => string
	}

	export interface Events {
		start: {
			pid: number
			kill: () => void
		}

		exit: {
			status: number
			stdio: {
				output?: string
				error?: string
			}
		}
	}

	export interface Export {
		run: (
			context: slime.jrunscript.shell.internal.module.java.Context,
			configuration: slime.jrunscript.shell.internal.module.java.Configuration,
			module: {
				events: any
			},
			events: slime.jrunscript.shell.run.Events,
			p: slime.jrunscript.shell.run.Argument,
			invocation: slime.jrunscript.shell.run.Argument
		) => Result

		buildStdio: (p: slime.jrunscript.shell.invocation.Stdio) => slime.jrunscript.shell.internal.module.RunStdio
	}

	export type Factory = slime.loader.Product<Context,Export>
}
