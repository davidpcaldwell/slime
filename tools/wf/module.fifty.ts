//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf {
	export interface Project {
		base: string
	}
}

namespace slime.jsh.wf.internal.module {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			node: slime.jsh.shell.tools.node.Exports
		}

		world?: {
			filesystem?: slime.jrunscript.file.world.Filesystem
		}
	}

	export namespace exports {
		export interface Project {
		}
	}

	export namespace exports {
		export interface Project {
			typescript: exports.project.Typescript
		}
	}

	export interface Exports {
		typescript: exports.Typescript

		/**
		 * Functions that operate on `wf` {@link slime.jsh.wf.Project | Project}s.
		 */
		Project: exports.Project
	}

	export type Script = slime.loader.Script<Context,Exports>

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.load("typescript.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);
}
