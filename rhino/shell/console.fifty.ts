//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	/**
	 * A `Console` is a construct used to represent somewhere where an application might send text output. One implementation of
	 * `Console` is {@link slime.jsh.shell.Exports["console"] jsh.shell.console}, which allows top-level `jsh` scripts to write text to
	 * the standard error stream (and appends a trailing line separator to each message). Other implementations might include files
	 * or any other locations to which applications might wish to emit messages or logging to be immediately or later read.
	 */
	export type Console = slime.$api.fp.impure.Effect<string>;
}

namespace slime.jrunscript.shell.console {
	export interface Exports {
		from: {
			/**
			 * Creates a {@link Console} that writes strings to the given file location (overwriting the file if it exists, and
			 * creating it if it does not), in order. Note that no delimiter is used between messages.
			 *
			 * @param p
			 * @returns
			 */
			location: (p: {
				location: slime.jrunscript.file.Location
			}) => Console
		}

		/**
		 * Creates a {@link Console} {@link slime.$api.fp.Transform Transform} that appends the given line separator to each
		 * message written to the console.
		 *
		 * @param separator
		 * @returns
		 */
		line: (separator: string) => slime.$api.fp.Transform<Console>
	}
}

namespace slime.jrunscript.shell.internal.console {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const script: Script = fifty.$loader.script("console.js");
			return script({
				library: {
					file: fifty.global.jsh.file
				}
			});
		//@ts-ignore
		})(fifty);
	}

	export type Exports = slime.jrunscript.shell.Exports["Console"]

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.suite = function() {
				const readFile: slime.$api.fp.Mapping<slime.jrunscript.file.Location,string> = $api.fp.Partial.impure.old.exception({
					try: $api.fp.world.mapping(jsh.file.Location.file.read.string.world()),
					nothing: function(t) { throw new Error("File not present: " + t.pathname); }
				});

				run(function plain() {
					const one = fifty.jsh.file.temporary.location();
					var streamOne = subject.from.location({
						location: one
					});
					streamOne("foo");
					streamOne("bar");

					var result = $api.fp.now.invoke(
						one,
						readFile
					);
					verify(result).is("foobar");
				});

				run(function line() {
					const two = fifty.jsh.file.temporary.location();
					const streamTwo = subject.line("\n")(subject.from.location({
						location: two
					}));
					streamTwo("foo");
					streamTwo("bar");

					verify(two).evaluate(readFile).is("foo\nbar\n");
				});

				run(function parentDoesNotExist() {
					var location = $api.fp.impure.now.input(
						$api.fp.impure.Input.map(
							fifty.jsh.file.temporary.directory,
							jsh.file.Location.directory.relativePath("foo/bar")
						)
					);

					verify({ location: location }).evaluate(subject.from.location).threw.type(Error);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
