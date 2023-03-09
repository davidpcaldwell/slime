//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		fifty.tests.suite = function() {
			fifty.load("../loader/expression.fifty.ts");
			fifty.load("../loader/browser/client.fifty.ts");
			fifty.load("../loader/browser/test/events.fifty.ts");
			fifty.load("../loader/api/old/unit.fifty.ts");
			fifty.load("../loader/document/module.fifty.ts");
			fifty.load("../js/web/module.fifty.ts");
			fifty.load("../js/codec/ini.fifty.ts");
			fifty.load("../js/time/module.fifty.ts");
			fifty.load("../js/object/module.fifty.ts");
		}
	}
//@ts-ignore
)(fifty);
