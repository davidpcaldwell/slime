//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.internal.scripts {
	export interface Scope {
		$platform: slime.runtime.$platform
		$engine: slime.runtime.internal.Engine
		//$slime: slime.runtime.$slime.Deployment
		compiler: slime.runtime.loader.Compiler
		$api: slime.$api.Global
	}

	export interface Exports {
		methods: {
			run: (code: slime.runtime.loader.Code, scope: { [name: string]: any }) => void
			old: {
				value: (code: slime.runtime.loader.Code, scope: { [name: string]: any }) => any
				file: (code: slime.runtime.loader.Code, context: { [name: string]: any }) => { [x: string]: any }
			}
		}

		toExportScope: slime.runtime.Exports["old"]["loader"]["tools"]["toExportScope"]

		createScriptScope: <C extends { [x: string]: any },T>($context: C) => {
			$context: C
			$export: (t: T) => void
			$exports: T
		}
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

	export type Script = slime.loader.Script<Scope,Exports>
}
