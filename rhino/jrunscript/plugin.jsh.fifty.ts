//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		internal: {
			bootstrap: slime.jsh.internal.launcher.Global["$api"]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.manual = function() {
				jsh.shell.console(String(jsh.internal.bootstrap));
			}
		}
	//@ts-ignore
	)(fifty);
}
