//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.code {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			git: slime.jrunscript.tools.git.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: fifty.test.Kit) {
			const script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					file: fifty.global.jsh.file,
					git: fifty.global.jsh.tools.git
				}
			});
		//@ts-ignore
		})(fifty);
	}

	export interface File {
		path: string
		file: slime.jrunscript.file.world.Location
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
		File: {
			hasShebang: () => slime.$api.fp.world.Question<File,void,slime.$api.fp.Maybe<boolean>>
			isText: () => slime.$api.fp.world.Question<File,void,slime.$api.fp.Maybe<boolean>>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.File = {};
			fifty.tests.File.hasShebang = function() {
				var wf = fifty.jsh.file.relative("../../wf");
				var jxa = fifty.jsh.file.relative("../../jxa.bash");
				var foo = fifty.jsh.file.relative("../../foo");

				var hasShebang = $api.fp.world.mapping(test.subject.File.hasShebang());

				var wfHas = hasShebang({
					path: "wf",
					file: wf
				});
				var jxaHas = hasShebang({
					path: "jxa.bash",
					file: jxa
				});
				var fooHas = hasShebang({
					path: "foo",
					file: foo
				});
				verify(wfHas).present.is(true);
				verify(jxaHas).present.is(true);
				verify(fooHas).present.is(false);

				if (wfHas.present) {
					verify(wfHas).value.is(true);
				}
				if (jxaHas.present) {
					verify(jxaHas).value.is(false);
				}
			}
		}
	//@ts-ignore
	)(fifty);

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

		handleDirectoryTrailingWhitespace: slime.$api.fp.world.Action<
			{
				base: slime.jrunscript.file.Directory
				exclude?: Excludes
				isText: isText
				nowrite?: boolean
			},
			FileEvents & TrailingWhitespaceEvents
		>

		handleGitTrailingWhitespace: slime.$api.fp.world.Action<
			{
				repository: string
				isText: isText
				nowrite?: boolean
			},
			FileEvents & TrailingWhitespaceEvents
		>

		handleDirectoryFinalNewlines: (p: {
			base: slime.jrunscript.file.Directory
			exclude?: Excludes
			isText?: isText
			nowrite?: boolean
		}) => slime.$api.fp.world.old.Tell<FileEvents & FinalNewlineEvents>

		handleGitFinalNewlines: slime.$api.fp.world.Action<
			{
				repository: string
				isText: isText
				nowrite?: boolean
			},
			FileEvents & FinalNewlineEvents
		>
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

	export namespace internal {
		export interface functions {
			getDirectorySourceFiles: slime.$api.fp.world.Question<
				{
					base: slime.jrunscript.file.Directory
					isText: isText
					exclude?: Excludes
				},
				FileEvents,
				slime.tools.code.File[]
			>

			getGitSourceFiles: slime.$api.fp.world.Question<
				{
					repository: slime.jrunscript.file.world.Location
					isText: isText
				},
				FileEvents,
				slime.tools.code.File[]
			>

			handleFileTrailingWhitespace: (configuration?: {
				nowrite?: boolean
			}) => slime.$api.fp.world.Action<slime.tools.code.File,TrailingWhitespaceEvents>

			handleFileFinalNewlines: (configuration?: {
				nowrite?: boolean
			}) => slime.$api.fp.world.Action<slime.tools.code.File,FinalNewlineEvents>

			handleFilesTrailingWhitespace: slime.$api.fp.world.Action<
				{
					files: slime.tools.code.File[],
					nowrite: boolean
				},
				FileEvents & TrailingWhitespaceEvents
			>

		}
	}
}
