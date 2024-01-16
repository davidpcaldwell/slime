//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.opendesktop {
	export interface Context {
		library: {
			js: slime.js.old.Exports

			//	TODO	used only for chmod and softlinking; should use file methods instead, although linking may not exist
			shell: Pick<slime.jrunscript.shell.Exports,"run"|"PATH">
		}
	}

	export interface Entry {
		get: (name: string) => string
		set: (name: string, value: string) => void
	}

	export interface Exports {
		Entry: {
			new (p: string): Entry

			new (p: {
				Type: string
				Name: string
				Exec: string

				[x: string]: string
			}): Entry
		}

		install: (p: {}) => void
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
