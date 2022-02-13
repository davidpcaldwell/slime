//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.internal.scripts {
	export interface Scope {
		$slime: slime.runtime.$slime.Deployment
		$platform: slime.runtime.$platform
		$engine: slime.runtime.internal.Engine
		$api: slime.$api.Global
		mime: slime.runtime.Exports["mime"]
		mimeTypeIs: (type: string) => (type: slime.mime.Type) => boolean
	}

	export interface Exports {
		methods: {
			run: (code: slime.Resource, scope: { [name: string]: any }) => void
			value: (code: slime.Resource, scope: { [name: string]: any }) => any
			file: (code: slime.Resource, context: { [name: string]: any }) => { [x: string]: any }
		}
		toExportScope: slime.runtime.Exports["Loader"]["tools"]["toExportScope"]
		createScriptScope: createScriptScope
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Scope,Exports>
}
