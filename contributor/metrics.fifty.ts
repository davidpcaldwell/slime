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
			project: slime.project.code.Exports
		}
	}

	export interface SourceFile {
		path: string
		file: slime.jrunscript.file.File
	}

	export interface Exports {
		getSourceFiles: (base: slime.jrunscript.file.Directory) => SourceFile[]

		SourceFile: {
			isJsapi: slime.$api.fp.Predicate<SourceFile>
			isGenerated: slime.$api.fp.Predicate<SourceFile>
		}

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
