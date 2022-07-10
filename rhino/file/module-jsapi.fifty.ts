//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export namespace test {
		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			var code: { fixtures: slime.jrunscript.file.test.fixtures.Script } = {
				fixtures: fifty.$loader.script("fixtures.ts")
			};
			var context = code.fixtures({
				fifty: fifty
			});

			var _context = new function() {
				var scope = context;
				var module = scope.module;
				this.filesystem = (module.filesystems.cygwin) ? module.filesystems.cygwin : module.filesystems.os;
				this.dir = scope.newTemporaryDirectory(this.filesystem);
				this.module = { Streams: scope.context.$Context.api.io.Streams };
			}
			if (!_context.dir) throw new Error("Missing context.dir");
			var filesystem = _context.filesystem;

			var dir = _context.dir.getRelativePath("filetests").createDirectory();

			var createFile = context.createFile;
			var createDirectory = context.createDirectory;

			var filea = createFile(dir,"a");
			var fileb = createFile(dir,"b");
			var filec = createDirectory(dir,"c");
			var filed = createFile(filec,"d");
			var filee = createDirectory(dir,"e");
			var filef = createFile(filee,"f");

			context.createFile(dir,"target",1112);

			var fixtures = {
				_context,
				filesystem,
				dir,
				filea,
				fileb,
				filec,
				filed,
				filee,
				filef
			}

			return {
				module: context,
				jsapi: fixtures
			}
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { run, verify } = fifty;

			const { createFile, createDirectory } = file.test.fixtures.module;

			const { filec, dir } = file.test.fixtures.jsapi;

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			fifty.tests.suite = function() {
				run(function() {
					var toDelete = createFile(filec,"toDelete");
					var toDeleteDir = createDirectory(dir,"toDelete.d");
					var zz = createFile(toDeleteDir, "zz");

					test(filec.list().length == 2);
					test(filec.getFile("toDelete") != null);
					var fileToDelete = filec.getFile("toDelete");
					fileToDelete.remove();
					test(filec.getFile("toDelete") == null);
					test(filec.list().length == 1);

					test(dir.getRelativePath("toDelete.d").directory != null);
					test(dir.getRelativePath("toDelete.d").directory.list().length == 1);
					dir.getRelativePath("toDelete.d").directory.remove();
					test(dir.getRelativePath("toDelete.d").directory == null);
				})
			}
		}
	//@ts-ignore
	)(fifty);
}
