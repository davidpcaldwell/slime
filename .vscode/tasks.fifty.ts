//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { jsh } = fifty.global;

		fifty.tests.manual = {};

		fifty.tests.manual.hello = function() {
			jsh.shell.console("Hello, World!");
		};

		fifty.tests.wip = fifty.tests.manual.hello;
	}
//@ts-ignore
)(fifty);
