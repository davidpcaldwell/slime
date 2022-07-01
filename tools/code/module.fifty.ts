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
		export const subject = (function(fifty: fifty.test.Kit) {
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

	export interface TrailingWhitespaceEvents {
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

	export interface FinalNewlineEvents {
		missing: slime.tools.code.File
		multiple: slime.tools.code.File
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

		checkSingleFinalNewline: (code: string) => {
			missing: boolean
			multiple: boolean
			fixed: string
		}

		getSourceFiles: (p: {
			base: slime.jrunscript.file.Directory
			isText?: isText
			exclude?: Excludes
		}) => slime.$api.fp.world.old.Ask<
			FileEvents,
			slime.tools.code.File[]
		>

		handleFileTrailingWhitespace: (configuration?: {
			nowrite?: boolean
		}) => (file: slime.tools.code.File) => slime.$api.fp.world.old.Tell<TrailingWhitespaceEvents>

		handleTrailingWhitespace: (p: {
			base: slime.jrunscript.file.Directory
			exclude?: Excludes
			isText?: isText
			nowrite?: boolean
		}) => slime.$api.fp.world.old.Tell<FileEvents & TrailingWhitespaceEvents>

		handleFinalNewlines: (p: {
			base: slime.jrunscript.file.Directory
			exclude?: Excludes
			isText?: isText
			nowrite?: boolean
		}) => slime.$api.fp.world.old.Tell<FileEvents & FinalNewlineEvents>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.filename = fifty.test.Parent();

			fifty.tests.filename.isText = function() {
				verify(test).subject.filename.isText("foo.txt").is(true);
				verify(test).subject.filename.isText("foo.wav").is(false);
				verify(test).subject.filename.isText("foo").is(void(0));
			}

			fifty.tests.checkSingleFinalNewline = function() {
				verify(test).subject.checkSingleFinalNewline("foo\n").missing.is(false);
				verify(test).subject.checkSingleFinalNewline("foo\n").multiple.is(false);
				verify(test).subject.checkSingleFinalNewline("foo\n").fixed.is("foo\n");

				verify(test).subject.checkSingleFinalNewline("foo\n\n").missing.is(false);
				verify(test).subject.checkSingleFinalNewline("foo\n\n").multiple.is(true);
				verify(test).subject.checkSingleFinalNewline("foo\n\n").fixed.is("foo\n");

				verify(test).subject.checkSingleFinalNewline("foo\n\n\n\n").missing.is(false);
				verify(test).subject.checkSingleFinalNewline("foo\n\n\n\n").multiple.is(true);
				verify(test).subject.checkSingleFinalNewline("foo\n\n\n\n").fixed.is("foo\n");

				verify(test).subject.checkSingleFinalNewline("foo").missing.is(true);
				verify(test).subject.checkSingleFinalNewline("foo").multiple.is(false);
				verify(test).subject.checkSingleFinalNewline("foo").fixed.is("foo\n");
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.filename);
				fifty.run(fifty.tests.checkSingleFinalNewline);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
