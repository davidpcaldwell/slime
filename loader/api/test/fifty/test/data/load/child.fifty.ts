//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.kit,
		tests: slime.fifty.test.tests,
		load: slime.fifty.test.load
	) {
		tests.suite = function() {
			fifty.verify("child").is("child")
			load("grandchild.fifty.ts", "types.Object", { a: 1 });
		}
	}
//@ts-ignore
)(fifty, tests, load);
