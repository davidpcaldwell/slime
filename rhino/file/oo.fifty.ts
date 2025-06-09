//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.oo {
	export interface Context {
		api: {
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
		}

		library: {
			world: slime.jrunscript.file.internal.java.Exports
		}

		pathext: slime.jrunscript.file.Context["pathext"]
		cygwin: slime.jrunscript.file.Context["cygwin"]
		addFinalizer: slime.jrunscript.file.Context["addFinalizer"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type Exports = Pick<slime.jrunscript.file.Exports,"filesystems"|"filesystem"|"Pathname"|"navigate"|"Searchpath"|"Loader"|"zip"|"unzip"|"list"|"state"|"action"|"object"|"Streams"|"java">

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			var MODIFIED_TIME = new jsh.time.When({ unix: 1599862384355 });

			fifty.tests.filetime = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.directory;
				directory.getRelativePath("file").write("foo");
				var file = directory.getFile("file");

				file.modified = jsh.time.When.codec.Date.encode(MODIFIED_TIME);
				var isNearestSecond = file.modified.getTime() == Math.floor(MODIFIED_TIME.unix / 1000) * 1000;
				var isMillisecond = file.modified.getTime() == MODIFIED_TIME.unix;
				verify(isNearestSecond || isMillisecond, "sNearestSecond || isMillisecond").is(true);
			}

			fifty.tests.filetime.testbed = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.directory;
				directory.getRelativePath("file").write("foo");
				var file = directory.getFile("file");

				var nio = file.pathname.java.adapt().toPath();
				jsh.shell.console(String(nio));
				Packages.java.nio.file.Files.setLastModifiedTime(nio, Packages.java.nio.file.attribute.FileTime.fromMillis(MODIFIED_TIME.unix));
				var _modified = Packages.java.nio.file.Files.getLastModifiedTime(nio);
				jsh.shell.console(_modified.toMillis());
			}

			fifty.tests.exports.navigate = function() {
				var module = jsh.file;
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;

				var toString = function(o) {
					return String(o);
				}

				tmp.getRelativePath("a/b/c").write("c", { append: false, recursive: true });
				tmp.getRelativePath("a/c/c").write("c", { append: false, recursive: true });

				var first = tmp.getRelativePath("a/b/c");
				var second = tmp.getRelativePath("a/c/c");

				var minimal = module.navigate({
					from: first,
					to: second
				});

				verify(minimal).base.evaluate(toString).is(tmp.getSubdirectory("a").toString());
				verify(minimal).relative.is("../c/c");

				var top = module.navigate({
					from: first,
					to: second,
					base: tmp
				});

				verify(top).base.evaluate(toString).is(tmp.toString());
				verify(top).relative.is("../../a/c/c");
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.suite = function() {
				verify(jsh.file.Streams).is.type("object");

				fifty.run(fifty.tests.exports);

				fifty.load("oo/file.fifty.ts");
				fifty.load("oo/filesystem.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
