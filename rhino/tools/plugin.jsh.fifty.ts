//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.java.tools {
	export interface Exports extends slime.jrunscript.java.tools.Exports {
		/** @deprecated */
		plugin: {
			/** @deprecated */
			hg: any

			/** @deprecated */
			git: any
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
}
