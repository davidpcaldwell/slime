//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.definition.test.promises {
	export interface Export {
		registry: {
			add: (item: any) => void
			list: () => any[]
			clear: () => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var subject: Export = fifty.$loader.module("promises.js");

			fifty.tests.suite = function() {
				fifty.verify(subject).registry.list().length.is(0);

				var a = Promise.resolve(3);
				var b = Promise.resolve(4);
				var c = Promise.reject(new Error("5"));

				fifty.verify(subject).registry.list().length.is(3);

				subject.registry.clear();
				fifty.verify(subject).registry.list().length.is(0);
			}
		}
	//@ts-ignore
	)(fifty);

}