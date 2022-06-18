//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git {
	export interface Commands {
		status: Command<void,command.status.Result>
	}

	export interface Commands {
		fetch: Command<void,void>
	}

	export interface Commands {
		merge: Command<{ name: string }, void>
	}

	export interface Commands {
		submodule: {
			update: Command<void,void>
		}
	}
}

namespace slime.jrunscript.tools.git.internal.commands {
	export interface Context {
	}

	export interface Exports extends slime.jrunscript.tools.git.Commands {
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
