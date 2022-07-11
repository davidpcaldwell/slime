//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.internal.jsh.launcher {
	export interface Context {
	}

	export interface Exports {
	}

	export namespace test {
		export interface Result {
			src: string
			home: string
			logging: string
			foo1: string
			foo2: string
			tmp: string
			rhino: {
				running: boolean
				optimization: number
				classpath: string
			}
		}
	}

	// (
	// 	function($export: slime.loader.Export<Exports>) {
	// 		var fifty: slime.fifty.test.Kit = null;
	// 		var verify = fifty.verify;
	// 	}
	// )

	// (
	// 	function(
	// 		fifty: slime.fifty.test.Kit
	// 	) {
	// 		fifty.tests.suite = function() {

	// 		}
	// 	}
	// //@ts-ignore
	// )(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
