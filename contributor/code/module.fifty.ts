//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.code {
	export interface Context {
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
			isText: slime.tools.code.isText

			exclude: slime.tools.code.Excludes

			trailingWhitespace: (p: {
				base: slime.jrunscript.file.Directory
				nowrite?: boolean
			}) => slime.$api.fp.impure.Tell<slime.tools.code.FileEvents & slime.tools.code.TrailingWhitespaceEvents>

			toHandler: (on: on) => slime.$api.events.Handler<slime.tools.code.FileEvents & slime.tools.code.TrailingWhitespaceEvents>
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

	export type Script = slime.loader.Script<Context,Exports>
}
