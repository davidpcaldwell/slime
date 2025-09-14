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
		export const readToString = (function(fifty: slime.fifty.test.Kit) {
			const $api = fifty.global.$api as slime.$api.jrunscript.Global;
			return function(file: archive.File<Entry>): string {
				return file.content.content.string.simple($api.jrunscript.io.Charset.default);
			};
		//@ts-ignore
		})($fifty)
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

			const $api_io = ($api as slime.$api.jrunscript.Global).jrunscript.io;

			var isFileEntry = function(p: slime.jrunscript.io.archive.Entry<{}>): p is slime.jrunscript.io.archive.File<{}> {
				return Boolean(p["content"]);
			};

			fifty.tests.exports.fidelity = function() {
				var aBitAgo = jsh.time.Value.now() - 1000000;

				const arbitrary_times: Entry["time"] = {
					modified: $api.fp.Maybe.from.some(aBitAgo - 1000000),
					created: $api.fp.Maybe.from.some(aBitAgo - 2000000),
					accessed: $api.fp.Maybe.from.some(aBitAgo - 3000000)
				};

				var buffer = new $api_io.Buffer();
				module.archive.zip.encode({
					to: buffer.writeBinary(),
					entries: $api.fp.Stream.from.array([
						{
							path: "a",
							time: arbitrary_times,
							comment: $api.fp.Maybe.from.nothing(),
							content: jsh.io.InputStream.string.default("aa")
						},
						{
							path: "b/c",
							time: arbitrary_times,
							comment: $api.fp.Maybe.from.nothing(),
							content: jsh.io.InputStream.string.default("cc")
						}
					])
				});
				buffer.close();

				var entries = $api.fp.now(
					{ stream: buffer.readBinary() },
					module.archive.zip.decode
				);

				//	TODO	for now there is no stream reduce
				var entries_array = $api.fp.Stream.collect(entries);

				/** @type { slime.js.Cast<{ [x: string]: archive.File<Entry> }> } */
				var castToUnzippedResult = $api.fp.identity;

				var unzipped: { [path: string]: slime.jrunscript.io.archive.File<Entry> } = entries_array.reduce(function(rv,entry) {
					if (isFileEntry(entry)) {
						rv[entry.path] = entry;
						// unzip.getRelativePath(entry.path).write(entry.content);
					} else {
						//unzip.getRelativePath(entry.path).createDirectory();
					}
					return rv;
				},(castToUnzippedResult({})));

				//	Standard ZIP format uses two-second time resolution
				//	see https://en.wikipedia.org/wiki/ZIP_%28file_format%29
				const withinTwoSecondsOf = function(n: slime.$api.fp.Maybe<number>) {
					return function(v) {
						if (!n.present) throw new Error();
						return Math.abs(v - n.value) <= 2000;
					}
				}

				verify(unzipped)["a"].evaluate(test.readToString).is("aa");
				verify(unzipped)["b/c"].evaluate(test.readToString).is("cc");

				["modified","created","accessed"].forEach(function(property: keyof Entry["time"]) {
					verify(unzipped)["a"].evaluate(function(entry) {
						if (!entry.time[property].present) throw new Error();
						fifty.global.jsh.shell.console(String(entry.time[property].value));
						fifty.global.jsh.shell.console(String(arbitrary_times[property]));
						return entry.time[property].value;
					}).evaluate(withinTwoSecondsOf(arbitrary_times[property])).is(true);
				});
			}

			//	TODO	this will really end up moving as it pertains to files, not streams, so will move to the file module where
			//			we convert files to entries
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
