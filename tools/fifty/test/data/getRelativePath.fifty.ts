//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.kit
	) {
		var relative = fifty.$loader.getRelativePath("module.js");

		fifty.tests.suite = function() {
			var r = relative;
			debugger;
			if (fifty.global.jsh) {
				fifty.global.jsh.shell.console(r);
			}
		}
	}
//@ts-ignore
)(fifty);
