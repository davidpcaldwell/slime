//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.io.zip {
	export interface Context {
		Streams: slime.jrunscript.runtime.io.Exports["Streams"]
		InputStream: slime.jrunscript.runtime.io.Exports["InputStream"]["java"]
	}

	export namespace test {
		export const readFile = function(file: slime.jrunscript.file.File): string {
			return file.read(String);
		};
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type Entry = {
		comment: slime.$api.fp.Maybe<string>
		time: {
			modified: slime.$api.fp.Maybe<number>
			created: slime.$api.fp.Maybe<number>
			accessed: slime.$api.fp.Maybe<number>
		}
	}

	export type Exports = slime.jrunscript.io.archive.Format<Entry>;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			//	TODO	fix this test not to use files, which are tested downstream

			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const module = jsh.io;

			var isFileEntry = function(p: slime.jrunscript.io.archive.Entry<{}>): p is slime.jrunscript.io.archive.File<{}> {
				return Boolean(p["content"]);
			};

			fifty.tests.exports.encode = function() {
				var zip = jsh.shell.TMPDIR.createTemporary({ suffix: ".zip" }).pathname;
				zip.file.remove();
				var unzip = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var now = jsh.time.Value.now();
				module.archive.zip.encode({
					to: zip.write(jsh.io.Streams.binary),
					entries: $api.fp.Stream.from.array([
						{
							path: "a",
							time: {
								modified: $api.fp.Maybe.from.some(now),
								accessed: $api.fp.Maybe.from.some(now),
								created: $api.fp.Maybe.from.some(now)
							},
							comment: $api.fp.Maybe.from.nothing(),
							content: jsh.io.InputStream.string.default("aa")
						},
						{
							path: "b/c",
							time: {
								modified: $api.fp.Maybe.from.some(now),
								accessed: $api.fp.Maybe.from.some(now),
								created: $api.fp.Maybe.from.some(now)
							},
							comment: $api.fp.Maybe.from.nothing(),
							content: jsh.io.InputStream.string.default("cc")
						}
					])
				});
				var entries = module.archive.zip.decode({
					stream: zip.file.read(jsh.io.Streams.binary),
				});

				$api.fp.now(
					entries,
					$api.fp.impure.Stream.forEach(function(entry) {
						if (isFileEntry(entry)) {
							unzip.getRelativePath(entry.path).write(entry.content);
						} else {
							unzip.getRelativePath(entry.path).createDirectory();
						}
					})
				);
				verify(unzip).getFile("a").evaluate(test.readFile).is("aa");
				verify(unzip).getFile("b/c").evaluate(test.readFile).is("cc");
			}

			fifty.tests.exports.decode = function() {
				var expanded = jsh.shell.TMPDIR.createTemporary({ directory: true });
				expanded.getRelativePath("a").write("a", { append: false });
				expanded.getRelativePath("b/c").write("c", { append: false, recursive: true });
				var zipped = jsh.shell.TMPDIR.createTemporary({ suffix: ".zip" }).pathname;
				zipped.file.remove();
				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var path = jsh.file.Searchpath([jsh.shell.java.home.getRelativePath("bin"),jsh.shell.java.home.parent.getRelativePath("bin")]);
				jsh.shell.run({
					command: path.getCommand("jar"),
					arguments: ["cf", zipped, "a", "b"],
					directory: expanded
				});
				var entries = module.archive.zip.decode(
					{
						stream: zipped.file.read(jsh.io.Streams.binary)
					}
				);
				$api.fp.now(
					entries,
					$api.fp.impure.Stream.forEach(function(entry) {
						if (!isFileEntry(entry)) {
							to.getRelativePath(entry.path).createDirectory();
						} else {
							to.getRelativePath(entry.path).write(entry.content);
						}
					})
				);
				verify(to).getFile("a").is.type("object");
				verify(to).getFile("aa").is.type("null");
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
