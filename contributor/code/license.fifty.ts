//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.license {
	export interface Context {
		getLicense: (name: string) => string
	}

	export interface Exports {
		mpl: any
		languages: any
		SourceFile: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
