//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.code {
	export interface Context {
		console: (message: string) => void
		library: {
			file: slime.jrunscript.file.Exports
			code: slime.tools.code.Exports
		}
	}

	export type on = {
		unknownFileType: (p: slime.tools.code.File) => void
		change: (p: { file: slime.tools.code.File, line: { number: number, content: string } } ) => void
		changed: (p: slime.tools.code.File) => void
		unchanged: (p: slime.tools.code.File) => void
	}

	export interface Exports {
		files: {
			isText: (node: slime.jrunscript.file.Node) => boolean | undefined

			trailingWhitespace: (p: {
				base: slime.jrunscript.file.Directory
				isText: slime.tools.code.isText
				on: on
				nowrite?: boolean
			}) => void
		}
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

	export type Script = slime.loader.Script<Context,Exports>
}
