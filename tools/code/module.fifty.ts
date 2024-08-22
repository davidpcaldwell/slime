//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.code {
	export interface Context {
		library: {
			document: slime.runtime.document.Exports
			file: slime.jrunscript.file.Exports
			git: slime.jrunscript.tools.git.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: fifty.test.Kit) {
			const script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					document: fifty.global.jsh.document,
					file: fifty.global.jsh.file,
					git: fifty.global.jsh.tools.git
				}
			});
		//@ts-ignore
		})(fifty);
	}

	/**
	 * A `Project` consists of a set of source files to be processed.
	 */
	export interface Project {
		base: slime.jrunscript.file.Location
		files: slime.jrunscript.file.Location[]
	}

	export interface Excludes {
		descend: slime.$api.fp.Predicate<slime.jrunscript.file.Location>
		isSource: isSource
	}

	export interface Exports {
		Project: {
			from: {
				directory: (p: {
					root: slime.jrunscript.file.Location
					excludes: Excludes
				}) => Project

				git: (p: {
					root: slime.jrunscript.file.Location
					submodules: boolean
					excludes?: Pick<Excludes,"isSource">
				}) => Project
			}

			files: (project: Project) => File[]

			gitignoreLocal: slime.$api.fp.world.Means<
				Project,
				{
					creating: {
						file: slime.jrunscript.file.Location
					}

					//	TODO	could consider line number
					//	TODO	what about exclusion patterns undoing what is found?
					found: {
						file: slime.jrunscript.file.Location
						pattern: string
					}

					updating: {
						file: slime.jrunscript.file.Location
					}
				}
			>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.Project = fifty.test.Parent();

			fifty.tests.manual = {};

			fifty.tests.manual.Project_from_directory = function() {
				var project = test.subject.Project.from.directory({
					root: fifty.jsh.file.relative("../.."),
					excludes: {
						descend: function(location) {
							if (location.pathname.indexOf(".git") != -1) {
								debugger;
							}
							if (/local$/.test(location.pathname)) return false;
							if (/\.git$/.test(location.pathname)) return false;
							return true;
						},
						isSource: function(file) {
							if (/\.git$/.test(file.pathname)) return $api.fp.Maybe.from.some(false);
							return $api.fp.Maybe.from.some(true);
						}
					}
				});
				jsh.shell.console(project.files.map($api.fp.property("pathname")).join(", "));
			};

			fifty.tests.manual.Project_gitignoreLocal = function() {
				$api.fp.world.now.action(
					test.subject.Project.gitignoreLocal,
					test.subject.Project.from.git({
						root: jsh.shell.PWD.pathname.os.adapt(),
						submodules: true,
						excludes: {
							isSource: $api.fp.Mapping.all($api.fp.Maybe.from.some(true))
						}
					}),
					{
						creating: function(e) {
							jsh.shell.console("Creating: " + e.detail.file.pathname);
						},
						updating: function(e) {
							jsh.shell.console("Updating: " + e.detail.file.pathname);
						},
						found: function(e) {
							jsh.shell.console("Found: " + e.detail.file.pathname);
						}
					}
				);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface JsapiMigrationData {
		name: string
		files: number
		bytes: number
		list: () => {
			path: string
			bytes: number
			tests: slime.$api.fp.Maybe<number>
		}[]
	}

	export interface JsapiAnalysis {
		jsapi: JsapiMigrationData
		fifty: JsapiMigrationData
	}

	export interface Exports {
		jsapi: {
			Location: {
				is: (p: slime.jrunscript.file.Location) => boolean
				parse: (p: slime.jrunscript.file.Location) => slime.$api.fp.Maybe<slime.runtime.document.Document>
				group: (p: slime.jrunscript.file.Location) => "jsapi" | "fifty" | "other"
			}

			Element: {
				getTestingElements: (p: slime.runtime.document.Document) => slime.runtime.document.Element[]
			}

			analysis: slime.$api.fp.Mapping<slime.tools.code.Project,slime.tools.code.JsapiAnalysis>

			report: (p: {
				line: slime.$api.fp.impure.Output<string>
			}) => slime.$api.fp.impure.Output<Project>
		}
	}

	export interface File {
		path: string
		file: slime.jrunscript.file.Location
	}

	export type isText = (p: slime.tools.code.File) => boolean | undefined

	export type oldIsSource = (p: slime.tools.code.File) => slime.$api.fp.Maybe<boolean>

	export type isSource = slime.$api.fp.Partial<slime.jrunscript.file.Location,boolean>

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

	export namespace old {
		export interface Excludes {
			file?: slime.$api.fp.Predicate<slime.jrunscript.file.File>
			directory?: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>
		}
	}

	export interface Exports {
		File: {
			from: {
				location: (base: slime.jrunscript.file.Location) => (location: slime.jrunscript.file.Location) => File
			}

			hasShebang: () => slime.$api.fp.world.Sensor<File,void,slime.$api.fp.Maybe<boolean>>

			isText: {
				world: () => slime.$api.fp.world.Sensor<File,void,slime.$api.fp.Maybe<boolean>>
				basic: slime.$api.fp.Mapping<File,slime.$api.fp.Maybe<boolean>>
			}

			isJavascript: slime.$api.fp.Mapping<File,boolean>
			isTypescript: slime.$api.fp.Mapping<File,boolean>

			isFiftyDefinition: slime.$api.fp.Mapping<File,boolean>

			javascript: {
				hasTypeChecking: (file: File) => slime.$api.fp.Maybe<boolean>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.File = fifty.test.Parent();
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
			/**
			 * Whether a given directory is named `local`. SLIME, and by convention, SLIME-based projects, use a `local`
			 * subdirectory of the project directory to store build products, installations of software tools, and so forth.
			 */
			isLocal: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>

			/**
			 * Whether a given directory is managed by a known source control system.
			 */
			isVcs: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>

			isBuildTool: slime.$api.fp.Predicate<slime.jrunscript.file.Directory>
		}

		defaults: {
			exclude: old.Excludes
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

		handleDirectoryTrailingWhitespace: slime.$api.fp.world.Means<
			{
				base: slime.jrunscript.file.Directory
				exclude?: old.Excludes
				isText: isText
				nowrite?: boolean
			},
			FileEvents & TrailingWhitespaceEvents
		>

		handleGitTrailingWhitespace: slime.$api.fp.world.Means<
			{
				repository: string
				isText: isText
				nowrite?: boolean
			},
			FileEvents & TrailingWhitespaceEvents
		>

		handleDirectoryFinalNewlines: slime.$api.fp.world.Means<
			{
				base: slime.jrunscript.file.Directory
				exclude?: old.Excludes
				isText?: isText
				nowrite?: boolean
			},
			FileEvents & FinalNewlineEvents
		>

		handleGitFinalNewlines: slime.$api.fp.world.Means<
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
				fifty.run(fifty.tests.File);
				fifty.run(fifty.tests.filename);
				fifty.run(fifty.tests.checkSingleFinalNewline);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>

	export namespace internal {
		export interface functions {
			getDirectoryObjectSourceFiles: slime.$api.fp.world.Sensor<
				{
					base: slime.jrunscript.file.Directory
					isText: isText
					exclude?: old.Excludes
				},
				FileEvents,
				slime.tools.code.File[]
			>

			getGitSourceFiles: slime.$api.fp.world.Sensor<
				{
					repository: slime.jrunscript.file.Location
					submodules: boolean
					isSource: oldIsSource
				},
				FileEvents,
				slime.tools.code.File[]
			>

			handleFileTrailingWhitespace: (configuration?: {
				nowrite?: boolean
			}) => slime.$api.fp.world.Means<slime.tools.code.File,TrailingWhitespaceEvents>

			handleFilesTrailingWhitespace: (configuration?: {
				nowrite?: boolean
			}) => slime.$api.fp.world.Means<
				slime.tools.code.File[],
				TrailingWhitespaceEvents
			>

			handleFileFinalNewlines: (configuration?: {
				nowrite?: boolean
			}) => slime.$api.fp.world.Means<slime.tools.code.File,FinalNewlineEvents>
		}
	}
}
