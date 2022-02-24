//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.code {
	export type isText = (p: {
		path: string
		node: slime.jrunscript.file.Node
	}) => boolean | undefined

	export type on = {
		unknownFileType: (p: { path: string, node: slime.jrunscript.file.File }) => void
		change: (p: { path: string, line: { number: number, content: string } } ) => void
		changed: (p: { path: string, node: slime.jrunscript.file.File }) => void
		unchanged: (p: { path: string, node: slime.jrunscript.file.File }) => void
	}

	export interface Context {
		console: (message: string) => void
		library: {
			file: slime.jrunscript.file.Exports
		}
	}

	export interface Exports {
		files: {
			isText: (node: slime.jrunscript.file.Node) => boolean | undefined

			trailingWhitespace: (p: {
				base: slime.jrunscript.file.Directory
				isText: isText
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
