//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.io.zip {
	export interface Context {
		Streams: slime.jrunscript.runtime.io.Exports["Streams"]
		InputStream: slime.jrunscript.runtime.io.Exports["InputStream"]["from"]["java"]
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

	export type Exports = slime.jrunscript.io.ArchiveFormat;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const module = jsh.io;

			fifty.tests.exports.encode = function() {
				var expanded = jsh.shell.TMPDIR.createTemporary({ directory: true });
				expanded.getRelativePath("a").write("aa", { append: false });
				expanded.getRelativePath("b/c").write("cc", { append: false, recursive: true });
				var zip = jsh.shell.TMPDIR.createTemporary({ suffix: ".zip" }).pathname;
				zip.file.remove();
				var unzip = jsh.shell.TMPDIR.createTemporary({ directory: true });
				module.archive.zip.encode({
					stream: zip.write(jsh.io.Streams.binary),
					entries: [
						//	TODO	why are these casts necessary
						{ path: "a", resource: expanded.getFile("a") as unknown as slime.jrunscript.runtime.old.Resource },
						{ path: "b/c", resource: expanded.getFile("b/c") as unknown as slime.jrunscript.runtime.old.Resource }
					]
				});
				module.archive.zip.decode({
					stream: zip.file.read(jsh.io.Streams.binary),
					output: {
						directory: function(p) {
							unzip.getRelativePath(p.path).createDirectory();
						},
						file: function(p) {
							return unzip.getRelativePath(p.path).write(jsh.io.Streams.binary, { append: false });
						}
					}
				});
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
				module.archive.zip.decode(
					{
						stream: zipped.file.read(jsh.io.Streams.binary),
						output: {
							directory: function(p) {
								to.getRelativePath(p.path).createDirectory();
							},
							file: function(p) {
								return to.getRelativePath(p.path).write(jsh.io.Streams.binary, { append: false });
							}
						}
					}
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
