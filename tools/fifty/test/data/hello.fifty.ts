//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.internal.test {
	export interface Context {
	}

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.suite = function() {
				debugger;
				verify("a fact").is("a fact");
			}
		}
	//@ts-ignore
	)($fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
