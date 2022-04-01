//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	export interface Exports {
		browser: {
			/**
			 * Browsers in precedence order
			 */
			installed: slime.jsh.unit.Browser[] & {
				[id: string]: slime.jsh.unit.Browser
			}

			//	TODO	below are probably unused
			Modules: any
			Browser: any
			IE: any
			Firefox: any
			Chrome: any
			Safari: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.manual = {};
			fifty.tests.manual.browsers = function() {
				jsh.unit.browser.installed.forEach(function(installed) {
					jsh.shell.console("id = " + installed.id);
					jsh.shell.console("name = " + installed.name);
					jsh.shell.console("delegate = " + installed.delegate);
				})
			}
		}
	//@ts-ignore
	)(fifty);
}
