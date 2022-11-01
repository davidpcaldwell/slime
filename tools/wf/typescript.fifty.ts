//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.internal.typescript {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			node: slime.jsh.Global["shell"]["tools"]["node"]
		}
	}

	export interface Invocation {
		stdio: Parameters<slime.jrunscript.shell.Exports["Invocation"]["create"]>[0]["stdio"]

		configuration: {
			typescript: {
				version: string
				/**
				 * Pathname of the project file (for example, `tsconfig.json`, `jsconfig.json`).
				 */
				configuration: string
			}
		}

		/**
		 * The pathname of the project to document.
		 */
		project: string

		/**
		 * Destination to provide as the `out` configuration parameter.
		 */
		out?: string
	}

	export interface Exports {
		typedoc: {
			invocation: (p: Invocation) => (node: slime.jrunscript.node.world.Installation) => slime.jrunscript.shell.run.Invocation
		}
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
