//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.test {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const script: Script = fifty.$loader.script("fixtures.ts");
			return script();
		//@ts-ignore
		})(fifty);
	}
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			const { $api, jsh } = fifty.global;
			const $f = $api.fp;

			fifty.tests.cache = fifty.test.Parent();

			fifty.tests.cache.built = function() {
				var built1 = test.subject.shells(fifty).built(false);
				var built2 = test.subject.shells(fifty).built(false);
				verify(built1).home.is(built2.home);
			};

			fifty.tests.cache.packaged = function() {
				var packaged1 = test.subject.shells(fifty).packaged(fifty.jsh.file.relative("test/jsh-data.jsh.js").pathname);
				var packaged2 = test.subject.shells(fifty).packaged(fifty.jsh.file.relative("test/jsh-data.jsh.js").pathname);
				verify(packaged1).is(packaged2);
			};

			fifty.tests.suite = function() {
				run(fifty.tests.cache);
			};
		}
	//@ts-ignore
	)(fifty);
}
