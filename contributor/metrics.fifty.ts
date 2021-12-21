//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.metrics {
	export interface Context {
		library: {
			document: slime.runtime.document.Exports
			file: slime.jrunscript.file.Exports
		}
	}

	export interface Exports {
		getSourceFiles: (base: slime.jrunscript.file.Directory) => {
			path: string
			node: slime.jrunscript.file.Node
		}[]

		jsapi: (base: slime.jrunscript.file.Directory) => {
			jsapi: {
				name: "jsapi"
				files: number
				bytes: number
				list: {
					path: string
					bytes: number
				}[]
			}
			fifty: {
				name: "fifty"
				files: number
				bytes: number
			}
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}