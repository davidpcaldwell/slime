//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.internal.typescript {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			node: slime.jsh.Global["shell"]["tools"]["node"]
		}
	}

	export interface Invocation {
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
	}

	export interface Exports {
		typedoc: {
			invocation: (p: Invocation) => slime.jrunscript.node.Invocation

			/**
			 * Given a TypeScript configuration and project directory, runs TypeDoc and returns a boolean: `true` for success, false
			 * for failure.
			 */
			run: slime.$api.fp.world.Question<{
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
			},void,boolean>
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
