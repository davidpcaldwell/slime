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

			fifty.tests.exports.encode = function() {
				const { io } = ($api as slime.$api.jrunscript.Global).jrunscript;

				type TypedFunction<T extends any[], R> = (...args: T) => R

				type Invocation<F extends TypedFunction<any,any>> = (
					F extends TypedFunction<
						infer FT,
						infer FR
					>
					? {
						function: TypedFunction<FT,FR>,
						arguments: FT
					}
					: never
				);

				const invoke = function<T extends any[],R>(p: Invocation<TypedFunction<T,R>>) {
					return p.function.apply(null, p.arguments) as R
				}

				//	TODO	we model jsh.file.Location.file.write.open.simple as a Mapping, but is it a good one? If you call it
				// 			twice, you'll get two different things (which on the other hand will behave identically)
				const openFile = $api.fp.pipe(
					jsh.file.Location.file.write.open,
					$api.fp.property("simple"),
					$api.fp.Mapping.now({ append: false, recursive: true })
				);

				const readString = jsh.file.Location.Function({
					directory: $api.fp.Mapping.from.value("(directory)"),
					file: jsh.file.Location.file.read.string.simple
				});

				var base = $api.fp.now(fifty.jsh.file.temporary.directory(), jsh.file.Location.directory.base);

				const write2 = $api.fp.pipe(
					$api.fp.identity as slime.$api.fp.Identity<{ path: string, content: string}>,
					function(p) { return { base: base(p.path), content: p.content } },
					function(p) { return { stream: openFile(p.base), content: p.content }},
					function(p) { return { pipeToFile: p.stream.pipe.simple, content: p.content }},
					function(p) { return { function: p.pipeToFile, arguments: [io.InputStream.string.default(p.content)] }},
					invoke
				);

				//	also works
				const write1 = function(p: { path: string, content: string }): void {
					$api.fp.now(
						p.path,
						base,
						openFile,
						$api.fp.property("pipe"),
						$api.fp.property("simple"),
						$api.fp.impure.Effect.now(io.InputStream.string.default(p.content))
					)
				};

				const write = write2;

				write({ path: "a", content: "aa" });
				write({ path: "b/c", content: "cc" });
				write({ path: "d/e/f", content: "ff" });

				var forList = $api.fp.now(
					base(""),
					jsh.file.Location.directory.list.stream.simple({ descend: location => true }),
					$api.fp.Stream.collect
				);

				jsh.shell.console("list = \n" + forList.map( location => (location.pathname + ": " + readString(location)) ).join("\n"));

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
