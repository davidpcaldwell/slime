//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.old {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const module = fifty.$loader.module("Error.js");

			const test = function(b: boolean) {
				verify(b).is(true);
			};

			fifty.tests.suite = function() {
				var throwType = function(Unimplemented) {
					try {
						throw new Unimplemented("Some API");
					} catch (e) {
						//	Work around Rhino bug in which e is not in scope in debugger
						var error = e;
						test(e instanceof Error);
						test(e instanceof Unimplemented);
						test(e.name == "Unimplemented");
						test(e.message == "Some API");
						//	Manually examine stack property, which is non-standard and thus not consistent
						debugger;
					}
				}

				var Unimplemented = new module.Error.Type("Unimplemented");
				throwType(Unimplemented);
				throwType(module.Error.Type("Unimplemented"));

				try {
					throw Unimplemented("Some API");
				} catch (e) {
					test(e instanceof Error);
					test(e instanceof Unimplemented);
					test(e.name == "Unimplemented");
					test(e.message == "Some API");
				}

				try {
					throw new Unimplemented("Some API with data", { foo: "bar" });
				} catch (e) {
					test(e instanceof Error);
					test(e instanceof Unimplemented);
					test(e.name == "Unimplemented");
					test(e.message == "Some API with data");
					test(e.foo == "bar");
				}

				try {
					throw new Unimplemented("Some API with data", null);
				} catch (e) {
					test(e instanceof Error);
					test(e instanceof Unimplemented);
					test(e.name == "Unimplemented");
					test(e.message == "Some API with data");
				}
			};

			fifty.test.platforms();
		}
	//@ts-ignore
	)(fifty);
}
