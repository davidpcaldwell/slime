//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.definition.api_html {
	export interface Context {
		test?: boolean
		api: {
			assign?: typeof Object.assign
		}
		Verify: slime.definition.verify.Export
		Suite?: any
		run: (code: any, scope?: any) => void
	}

	export interface Exports {
		Part: any
		Suite: any
		cli: any
		documentation: any
		ApiHtmlTests: any
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

	export type Script = slime.loader.Script<Context|void,Exports>
}
