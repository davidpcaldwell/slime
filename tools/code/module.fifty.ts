//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.code {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: fifty.test.kit) {
			const script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					file: fifty.global.jsh.file
				}
			});
		//@ts-ignore
		})(fifty);
	}

	export interface File {
		path: string
		file: slime.jrunscript.file.File
	}

	export type isText = (p: slime.tools.code.File) => boolean | undefined

	export interface FileEvents {
		unknownFileType: slime.tools.code.File
	}

	export interface CodeEvents {
		foundIn: slime.tools.code.File
		notFoundIn: slime.tools.code.File
		foundAt: {
			file: slime.tools.code.File
			line: {
				number: number
				content: string
			}
		}
	}

	export interface Excludes {
		file?: slime.$api.fp.Predicate<slime.jrunscript.file.File>
		directory?: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>
	}

	export interface Exports {
		filename: {
			isText: (name: string) => boolean | undefined
			isVcsGenerated: (name: string) => boolean
			isIdeGenerated: (name: string) => boolean
		}

		directory: {
			isLocal: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>
			isVcs: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>
			isBuildTool: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>
		}

		defaults: {
			exclude: Excludes
		}

		scanForTrailingWhitespace: (code: string) => {
			without: string
			instances: {
				line: number
				content: string
			}[]
		}

		getSourceFiles: (p: {
			base: slime.jrunscript.file.Directory
			isText?: isText
			exclude?: Excludes
		}) => slime.$api.fp.impure.Ask<
			FileEvents,
			slime.tools.code.File[]
		>

		handleFileTrailingWhitespace: (configuration?: {
			nowrite?: boolean
		}) => (file: slime.tools.code.File) => slime.$api.fp.impure.Tell<CodeEvents>

		handleTrailingWhitespace: (p: {
			base: slime.jrunscript.file.Directory
			exclude?: Excludes
			isText?: isText
			nowrite?: boolean
		}) => slime.$api.fp.impure.Tell<FileEvents & CodeEvents>
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;

			fifty.tests.suite = function() {
				verify(test).subject.filename.isText("foo.txt").is(true);
				verify(test).subject.filename.isText("foo.wav").is(false);
				verify(test).subject.filename.isText("foo").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
