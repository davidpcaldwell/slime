//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		io: slime.jrunscript.io.Exports
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var verify = fifty.verify;
			var jsh = fifty.global.jsh;

			fifty.tests.suite = function() {
				fifty.load("../../loader/expression.fifty.ts", "runtime.types.exports.Loader", jsh.io.Loader);
			}
		}
	//@ts-ignore
	)(fifty);

}
