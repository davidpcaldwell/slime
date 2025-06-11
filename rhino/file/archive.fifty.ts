//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.archive {
	export interface Exports {
		zip: {
			map: (p: Location) => slime.jrunscript.io.zip.Entry
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const io = jsh.io;
			const module = jsh.file;
			const subject = jsh.file.archive;

			// var isFileEntry = function(p: slime.jrunscript.io.archive.Entry<{}>): p is slime.jrunscript.io.archive.File<{}> {
			// 	return Boolean(p["content"]);
			// };

			fifty.tests.exports.encode = function() {
				const require = jsh.file.Location.directory.require({ recursive: true });
				const ezrequire = $api.fp.now(require, $api.fp.world.Means.effect());

				const newSimpleWriter = (location: slime.jrunscript.file.Location) => {
					return function(string: string) {
						$api.fp.now(location, jsh.file.Location.parent(), ezrequire);

						var input = ($api as slime.$api.jrunscript.Global).jrunscript.io.InputStream.string.default(string);
						var out = jsh.file.Location.file.write.open.simple(location)({ append: false });
						var operation = $api.fp.now(
							input.pipe.all,
							$api.fp.world.Action.output()
						);
						operation(out);
					};
				};

				var expanded = fifty.jsh.file.temporary.directory();
				var writeA = $api.fp.now(expanded, jsh.file.Location.directory.relativePath("a"), newSimpleWriter);
				writeA("aa");
				var writeC = $api.fp.now(expanded, jsh.file.Location.directory.relativePath("b/c"), newSimpleWriter);
				writeC("cc");
				var writeF = $api.fp.now(expanded, jsh.file.Location.directory.relativePath("d/e/f"), newSimpleWriter);
				writeF("ff");

				var forList = $api.fp.now(
					expanded,
					jsh.file.Location.directory.list.stream.simple({ descend: location => true }),
					$api.fp.Stream.collect
				);

				jsh.shell.console("list = " + forList.map( location => location.pathname ).join(" "));

				// var zip = jsh.shell.TMPDIR.createTemporary({ suffix: ".zip" }).pathname;
				// zip.file.remove();
				// var unzip = jsh.shell.TMPDIR.createTemporary({ directory: true });
				// var now = jsh.time.Value.now();
				// io.archive.zip.encode({
				// 	to: zip.write(jsh.io.Streams.binary),
				// 	entries: $api.fp.Stream.from.array([
				// 		{
				// 			path: "a",
				// 			time: {
				// 				modified: $api.fp.Maybe.from.some(now),
				// 				accessed: $api.fp.Maybe.from.some(now),
				// 				created: $api.fp.Maybe.from.some(now)
				// 			},
				// 			comment: $api.fp.Maybe.from.nothing(),
				// 			content: expanded.getFile("a").read(jsh.io.Streams.binary)
				// 		},
				// 		{
				// 			path: "b/c",
				// 			time: {
				// 				modified: $api.fp.Maybe.from.some(now),
				// 				accessed: $api.fp.Maybe.from.some(now),
				// 				created: $api.fp.Maybe.from.some(now)
				// 			},
				// 			comment: $api.fp.Maybe.from.nothing(),
				// 			content: expanded.getFile("b/c").read(jsh.io.Streams.binary)
				// 		}
				// 	])
				// });
				// var entries = module.archive.zip.decode({
				// 	stream: zip.file.read(jsh.io.Streams.binary),
				// });

				// $api.fp.now(
				// 	entries,
				// 	$api.fp.impure.Stream.forEach(function(entry) {
				// 		if (isFileEntry(entry)) {
				// 			unzip.getRelativePath(entry.path).write(entry.content);
				// 		} else {
				// 			unzip.getRelativePath(entry.path).createDirectory();
				// 		}
				// 	})
				// );
				// verify(unzip).getFile("a").evaluate(test.readFile).is("aa");
				// verify(unzip).getFile("b/c").evaluate(test.readFile).is("cc");
			}

			fifty.tests.exports.decode = function() {
				// var expanded = jsh.shell.TMPDIR.createTemporary({ directory: true });
				// expanded.getRelativePath("a").write("a", { append: false });
				// expanded.getRelativePath("b/c").write("c", { append: false, recursive: true });
				// var zipped = jsh.shell.TMPDIR.createTemporary({ suffix: ".zip" }).pathname;
				// zipped.file.remove();
				// var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				// var path = jsh.file.Searchpath([jsh.shell.java.home.getRelativePath("bin"),jsh.shell.java.home.parent.getRelativePath("bin")]);
				// jsh.shell.run({
				// 	command: path.getCommand("jar"),
				// 	arguments: ["cf", zipped, "a", "b"],
				// 	directory: expanded
				// });
				// var entries = module.archive.zip.decode(
				// 	{
				// 		stream: zipped.file.read(jsh.io.Streams.binary)
				// 	}
				// );
				// $api.fp.now(
				// 	entries,
				// 	$api.fp.impure.Stream.forEach(function(entry) {
				// 		if (!isFileEntry(entry)) {
				// 			to.getRelativePath(entry.path).createDirectory();
				// 		} else {
				// 			to.getRelativePath(entry.path).write(entry.content);
				// 		}
				// 	})
				// );
				// verify(to).getFile("a").is.type("object");
				// verify(to).getFile("aa").is.type("null");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.file.internal.archive {
	export interface Context {
	}

	export interface Exports extends slime.jrunscript.file.archive.Exports {
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
