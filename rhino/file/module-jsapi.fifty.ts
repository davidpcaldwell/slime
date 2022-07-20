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

			var dir: slime.jrunscript.file.Directory = _context.dir.getRelativePath("filetests").createDirectory();

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

			const { filec, dir, _context } = file.test.fixtures.jsapi;

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			fifty.tests._1 = function() {
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
			}

			var disableBreakOnExceptions = function<F extends Function>(f: F): F {
				return f;
			}

			fifty.tests._2 = function() {
				//var disableBreakOnExceptions = ($jsapi.debug && $jsapi.debug.disableBreakOnExceptions) ? $jsapi.debug.disableBreakOnExceptions : function(f) { return f; };
				var inPlace = disableBreakOnExceptions(function(ifExists?: any): slime.jrunscript.file.Directory {
					return dir.getRelativePath("created").createDirectory({ ifExists: ifExists });
				});
				var created = inPlace();
				verify(created).parent.evaluate(function(p) { return p.toString(); }).is(dir.toString());
	//			test( created.parent.toString() == dir.toString() );
				var timestamp = created.modified;

				try {
					created = inPlace();
					verify(false,"threw exception").is(true);
				} catch (e) {
					verify(true,"threw exception").is(true);
				}

				var created = inPlace( function() { return false; } );
				test( created.modified.getTime() == timestamp.getTime() );

				var created = inPlace( function(existing) { existing.remove(); return true; } );
				test( created.modified != timestamp );

				created.remove();
			}

			fifty.tests._3 = function() {
				var mydir = createDirectory(dir, "write");
				test( (mydir != null) );

				var a = mydir.getRelativePath("a");
				var b = mydir.getRelativePath("b/c");

				var checkError = function(f) {
					try {
						f();
						return true;
					} catch (e) {
						return false;
					}
				}

				var Streams = _context.module.Streams;
				test( checkError( function() { a.write(Streams.binary).close(); } ) );
				test( !checkError( function() { b.write(Streams.binary).close(); } ) );
				test( checkError( function() { b.write(Streams.binary, { recursive: true}).close(); } ) );
				test( !checkError( function() { b.write(Streams.binary).close(); } ) );
				test( checkError( function() { b.write(Streams.binary, {append: false}).close(); } ) );

				var writeAndClose = function(path,string,append) {
					path.write(string, { append: append });
				}

				writeAndClose(a,"Hello",true);
				test( a.file.read(String) == "Hello" );
				writeAndClose(a,"Hello",false);
				test( a.file.read(String) == "Hello" );
				writeAndClose(a," World",true);
				test( a.file.read(String) == "Hello World" );
			}

			fifty.tests.suite = function() {
				run(fifty.tests._1);
				run(fifty.tests._2);
				run(fifty.tests._3);
			};
		}
	//@ts-ignore
	)(fifty);
}
