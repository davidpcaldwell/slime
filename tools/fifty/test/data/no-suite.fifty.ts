//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.internal.test.data {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = function() {
				if (fifty.global.jsh) fifty.global.jsh.shell.console("Hello, World!");
				if (fifty.global.window) fifty.global.window["console"].log("Hello, World!")
			}
		}
	//@ts-ignore
	)($fifty);
}
