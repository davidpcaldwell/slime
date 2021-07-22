//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

///<reference lib="es2015.promise"/>
(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.a = function() {
			Promise.resolve("a").then(function(item) {
				fifty.verify(item).is("a");
			});
		}

		fifty.tests.b = function() {
			fifty.verify("b").is("b");
		}

		fifty.tests.c = function() {
			Promise.resolve("c").then(function(item) {
				fifty.verify(item).is("c");
			});
		}

		fifty.tests.suite = function() {
			run(fifty.tests.a);
			run(fifty.tests.b);
			run(fifty.tests.c);
		}
	}
//@ts-ignore
)(fifty);
