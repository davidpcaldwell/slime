//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.documentation.updater {
	export interface Context {
		library: {
			java: slime.jrunscript.host.Exports
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}
		typedoc: {
			invocation: slime.jsh.Global["wf"]["typescript"]["typedoc"]["invocation"]
		}
	}

	export namespace internal {
		export type Process = {
			out: () => string
			started: () => number
			kill: () => void
		}

		export type Listener = {
			started: Process
			finished: Process
			errored: Process
		}

		export type Update = slime.$api.fp.world.Action<
			{
				project: slime.jrunscript.file.world.Location
			},
			Listener
		>
	}

	export interface Updater {
	}

	export interface Exports {
		Updater: (p: {
			project: string
		}) => Updater
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
