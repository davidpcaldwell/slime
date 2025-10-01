//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.filesystem {
	export interface Context {
		Searchpath: slime.jrunscript.file.internal.file.Exports["Searchpath"]
		Pathname: slime.jrunscript.file.internal.file.Exports["Pathname"]
	}

	export interface Exports {
		Filesystem: new (
			filesystem: slime.jrunscript.file.world.Filesystem,
			provider: slime.jrunscript.file.internal.java.FilesystemProvider
		) => OsFilesystem
	}

	/**
	 * A representation of a filesystem that provides support for object-oriented APIs.
	 */
	export interface Filesystem extends slime.jrunscript.file.Filesystem {
	}

	export type Script = slime.loader.Script<Context,Exports>

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			var script: internal.test.fixtures.Script = fifty.$loader.script("../fixtures.ts");
			var fixtures = script({ fifty: fifty, prefix: "../" });

			const { context, module, newTemporaryDirectory, createFile, createDirectory, filesystem } = fixtures;

			var { UNIX } = (
				function() {
					const UNIX = (filesystem.$unit.getPathnameSeparator() == "/");

					return {
						UNIX
					}
				}
			)();

			fifty.tests.filesystem = function(fs: slime.jrunscript.file.Filesystem) {
				var Pathname = fs.Pathname;
				var test = function(b: boolean) {
					verify(b).is(true);
				};
				if (UNIX) {
					var foo = Pathname("/foo");
					verify(foo).parent.toString().is("");
					verify(foo).parent.directory.toString().is("/");
//						test( Pathname("/foo").parent.toString() == "/" );
					test( Pathname("/foo/bar").parent.toString() == "/foo" );
					test( Pathname("/").parent == null );
					test( Pathname("/").directory.list()[0].pathname.toString().substring(0,2) != "//" );
					test( Pathname("a").toString().length != 1 );
				} else {
					test( Pathname("C:\\cygwin").parent.toString() == "C:\\" );
					test( Pathname("C:\\cygwin\\tmp").parent.toString() == "C:\\cygwin" );
					test( Pathname("C:\\").parent == null );
				}

				if (UNIX) {
					test( Pathname("/home/inonit").basename == "inonit" );
					test( Pathname("/home").basename == "home" );
					verify("now").is("now");
					test( Pathname("/").basename == "" );
				} else {
					test( Pathname("C:\\cygwin\\tmp").basename == "tmp" );
					test( Pathname("C:\\cygwin").basename == "cygwin" );
					test( Pathname("C:\\").basename == "C:\\" );
				}
			};

			var getFilesystem = function() {
				return (module.filesystems.cygwin) ? module.filesystems.cygwin : module.filesystems.os;
			}

			fifty.tests.manual = {};

			fifty.tests.manual.fstest = function() {
				fifty.tests.filesystem(getFilesystem());
			}

			fifty.tests.suite = function() {
				var filesystem = getFilesystem();

				//	TODO	if Cygwin is present, we want to run on module.filesystems.cygwin, too, but that will require further
				//			modularization

				fifty.run(function fstest() {
					fifty.tests.filesystem(filesystem);
				});

				//	TODO	probably should move to filesystem.fifty.ts, and then UNIX can be removed from this file it appears
				if (UNIX) {
					var top = jsh.file.Pathname("/").directory;
					var HOME = jsh.shell.HOME.toString();
					var home = top.getSubdirectory(HOME.substring(1));
					verify(home).is.not(null);
				}
			}
		}
	//@ts-ignore
	)(fifty);
}
