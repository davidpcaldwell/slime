//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		verify: slime.definition.verify.Verify,
		tests: slime.fifty.test.tests
	) {
		tests.types.Object = function(object: { a: number }) {
			verify(object).a.is(1);
		}
	}
//@ts-ignore
)(verify, tests)
