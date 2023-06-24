//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.script.old.application {
	export interface Context {
		getopts: slime.jsh.script.Exports["getopts"]
	}

	/**
	 * Creates a top-level application that can have multiple *commands*, each of which have their own arguments, as well as global
	 * arguments that apply to all commands.
	 */
	export type Constructor = new (o: any) => any

	export type Exports = Constructor

	export type Script = slime.loader.Script<Context,Exports>
}
