//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export namespace test {
		export const fixtures = (function(Packages: slime.jrunscript.Packages, fifty: slime.fifty.test.Kit) {
			var code: { fixtures: slime.jrunscript.file.internal.test.fixtures.Script } = {
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

			var newJavaTemporaryDirectory = (function() {
				var tmpdir;

				var tmppath = function() {
					var path = Packages.java.lang.System.getProperty("java.io.tmpdir");
					var pathname = new Packages.java.text.SimpleDateFormat("yyyy.MM.dd.HH.mm.ss.SSS").format( new Packages.java.util.Date() );
					var dir = new Packages.java.io.File(new Packages.java.io.File(path), "jsunit/" + pathname);
					dir.mkdirs();
					return dir;
				};

				return function() {
					if (!tmpdir) tmpdir = tmppath();
					var rv = Packages.java.io.File.createTempFile("tmpdir-",".tmp",tmpdir);
					rv["delete"]();
					var success = rv.mkdirs();
					if (!success) {
						throw new Error("Failed to create " + rv);
					}
					return rv;
				};
			})();

			var fixtures = {
				_context,
				filesystem,
				dir,
				filea,
				fileb,
				filec,
				filed,
				filee,
				filef,
				newJavaTemporaryDirectory
			}

			return {
				module: context,
				jsapi: fixtures
			}
		//@ts-ignore
		})(Packages, fifty);
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { run, verify } = fifty;
			const { jsh } = fifty.global;

			const { createFile, createDirectory } = file.test.fixtures.module;

			const { filea, filec, dir, _context } = file.test.fixtures.jsapi;

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			const newTemporaryDirectory = function() {
				return jsh.shell.TMPDIR.createTemporary({ directory: true });
			}

			const filesystem = jsh.file.filesystems.os;

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

			fifty.tests._4 = function() {
				var purpleRain = new Date( 1999, 0, 1 );
				test( purpleRain.getTime() != filea.modified.getTime() );
				filea.modified = purpleRain;
				test(purpleRain.getTime() == filea.modified.getTime());
			}

			fifty.tests.Pathname = function() {
				var dir = newTemporaryDirectory();

				var filea = createFile(dir,"a");
				var fileb = createFile(dir,"b");
				var filec = createDirectory(dir,"c");
				var filed = createFile(filec,"d");
				var filee = createDirectory(dir,"e");
				var filef = createFile(filee,"f");

				createFile(dir,"target",1112);

				test(
					filea.pathname.toString().substring(filea.pathname.toString().length-1)
					!= filesystem.$unit.getPathnameSeparator()
				);
				test(
					filec.pathname.toString().substring(filec.pathname.toString().length-1)
					!= filesystem.$unit.getPathnameSeparator()
				);

				test(filea.pathname.basename == "a");
				test(filec.pathname.basename == "c");
				test(filed.pathname.basename == "d");
				test(filec.getRelativePath("..").directory.toString() == dir.toString());

				test( filec.getRelativePath("d").toString() == filed.pathname.toString() );
				test( filed.parent.getRelativePath("../b").toString() == fileb.pathname.toString() );
				test( filed.parent.getRelativePath("d").toString() == filed.pathname.toString() );
				test( filed.parent.getRelativePath("./d").toString() == filed.pathname.toString() );
				test( filed.parent.getRelativePath("../c/d").toString() == filed.pathname.toString() );

				test( !filea.directory );
				test( filec.directory );

				test( (function() {
					if (filed.parent == null) return false;
					return filed.parent.pathname.toString() == filec.pathname.toString();
				})() );
				test( (function() {
						if (filec.parent == null) return false;
						return filec.parent.pathname.toString() == dir.pathname.toString();
				})() );
			};

			fifty.tests.Node = fifty.test.Parent();
			fifty.tests.Node.getFile_getDirectory = function() {
				var directory = fifty.jsh.file.object.getRelativePath("module.js").file.parent;
				verify(directory).getFile("module.js").is.type("object");
				verify(directory).getFile("foo").is(null);

				verify(directory).getSubdirectory("java").is.type("object");	//	directory
				verify(directory).getFile("java").is(null);
			};

			fifty.tests.Directory = fifty.test.Parent();
			fifty.tests.Directory._toString = function() {
				var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var relative = tmpdir.getRelativePath("relative");
				var endsWithSlashPattern = /\/$/;
				var toStringMatches = function(regex: RegExp) {
					return function() {
						var string = this.toString();
						var rv = regex.test(string);
						jsh.shell.console("pattern = " + regex + " path=" + string + " rv=" + rv);
						return rv;
					}
				};
				var toStringEndsWithSlash = toStringMatches(/\/$/);
				var toStringEndsWithDoubleSlash = toStringMatches(/\/\/$/);
				verify(relative).evaluate(toStringEndsWithSlash).is(false);
				var directory = relative.createDirectory();
				jsh.shell.console(directory.toString());
				verify(relative).evaluate(toStringEndsWithSlash).is(false);
				verify(directory).evaluate(toStringEndsWithSlash).is(true);
				verify(directory).evaluate(toStringEndsWithDoubleSlash).is(false);
				//	TODO	fix this and see if it breaks anything else
				if (true) {
					verify(directory).pathname.evaluate(toStringEndsWithSlash).is(false);
				}
			}

			fifty.tests.stream = function() {
				const context = file.test.fixtures.module.context;
				const scope: { module: slime.jrunscript.file.Exports, streamdir: slime.jrunscript.file.Directory, $jsapi: any } = {
					module: file.test.fixtures.module.module,
					streamdir: void(0),
					$jsapi: {
						java: {
							io: {
								newTemporaryDirectory: file.test.fixtures.jsapi.newJavaTemporaryDirectory
							}
						}
					}
				}

				var hostdir = new Packages.java.io.File(scope.$jsapi.java.io.newTemporaryDirectory(), "streamtests");
				hostdir.mkdirs();
				var fileA = new Packages.java.io.File(hostdir, "a");
				var aWriter = new Packages.java.io.PrintWriter( new Packages.java.io.FileWriter( fileA ) );
				aWriter.print("Hello, World\n");
				aWriter.print("Hello, DOS World\r\n");
				aWriter.print("Finished.");
				aWriter.flush();
				aWriter.close();
				scope.streamdir = scope.module.filesystem.java.adapt(hostdir).directory;
	//			scope.streamdir = scope.module.filesystem.$unit.Pathname(scope.module.filesystem.$unit.getNode(hostdir)).directory;

				const { streamdir } = scope;

				(
					function() {
						var fileA = streamdir.getFile("a");
						var text = fileA.read(context.$Context.api.io.Streams.text);
						var lines = [];
						text.readLines( function(line) {
							lines.push(line);
						}, { ending: "\n" } );
						verify(lines,"lines").length.is(3);
						test( lines.filter( function(line) { return line.indexOf("\r") != -1 } ).length == 1 );
					}
				)();
			}

			fifty.tests.suite = function() {
				run(fifty.tests._1);
				run(fifty.tests._2);
				run(fifty.tests._3);
				run(fifty.tests._4);
				run(fifty.tests.Pathname);
				run(fifty.tests.Node);
				run(fifty.tests.Directory);
				run(fifty.tests.stream);
			};
		}
	//@ts-ignore
	)(Packages,fifty);
}
