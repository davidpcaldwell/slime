//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		fifty.tests.manual = {};
	}
//@ts-ignore
)(fifty);

namespace slime.jrunscript.file {
	//	TODO	improve
	/**
	 * An object representing a search path in the local file system.
	 *
	 * The `toString` method of this object generates a searchpath literal that can be used in commands.
	 */
	export interface Searchpath {
		/**
		 * The set of `Pathname`s that make up this search path.
		 */
		pathnames: slime.jrunscript.file.Pathname[]

		//	TODO	second paragraph could be clearer
		/**
		 * Returns a file representing a given command within this Searchpath.
		 *
		 * The implementation searches each directory within this Searchpath, looking for a file that corresponds to the given
		 * command. If the `pathext` property of the module context is specified, each extension in the `pathext` variable is
		 * appended to the given command name in succession in an attempt to locate the file. If this variable is not present, the
		 * system simply looks for raw files with the given name in each directory in the Searchpath.
		 *
		 * On macOS, which has stubs for various developer tools that offer to install the Xcode Command Line Tools, this method
		 * will detect those stubs and not return them. So `getCommand("git")` will not return `/usr/bin/git` unless `git` is
		 * actually installed. Note that in the existing implementation, this means if `/usr/bin/git` occurs earlier in the search
		 * path than a "real" `git`, the real one will not be found.
		 *
		 * @param name A name representing an executable command.
		 *
		 * @returns A file object corresponding to the given command, or `null` if no corresponding command could be found in this
		 * Searchpath.
		 */
		getCommand: (name: string) => slime.jrunscript.file.File
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;
			const { verify, run } = fifty;
			const module: Exports = fifty.global.jsh.file;

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			fifty.tests.one = function() {
				var x = module.Searchpath([]);
				if (jsh.shell.environment.SLIME_TEST_ISSUE_306) {
					verify(x instanceof module.Searchpath).is(true);
				}
				verify(x instanceof module.filesystems.os.Searchpath).is(true);
				var jhome = jsh.shell.java.home;
				var jdk = module.Searchpath([
					jhome.getRelativePath("bin")
				]);
				var command = jdk.getCommand("java");
				verify(typeof(command) == "object" && command && typeof(command.pathname) == "object").is(true);
			}

			fifty.tests.more = function() {
				var scope: {
					filesystem: Filesystem
					dir: any
					Searchpath: any
				} = {
					filesystem: void(0),
					dir: void(0),
					Searchpath: void(0)
				};
				scope.filesystem = (module.filesystems.cygwin) ? module.filesystems.cygwin : module.filesystems.os;
				scope.dir = scope.filesystem.$unit.temporary(null, { directory: true });
				scope.Searchpath = module.Searchpath;

				const { filesystem, dir, Searchpath } = scope;

				run(function one() {
					var pathelements = [ dir.getRelativePath("c"), dir.getRelativePath("e") ];
					if (typeof(pathelements[0]) == "undefined") throw "No/0";
					if (typeof(pathelements[1]) == "undefined") throw "No/1";
					var searchpath = Searchpath(pathelements);
					test(
						(
							searchpath.toString()
							== (
								dir.getRelativePath("c").toString()
								+ String( filesystem.$unit.getSearchpathSeparator() )
								+ dir.getRelativePath("e").toString()
							)
						)
						||
						//	TODO	the below branch is necessary for Mac OS X, which somehow is confusing /var and
						//			/private/var ... this could be a bug having to do with canonical paths, symlinks, etc.
						(
							searchpath.toString()
							== (
								String(dir.getRelativePath("c").java.adapt())
								+ String(filesystem.$unit.getSearchpathSeparator())
								+ String(dir.getRelativePath("e").java.adapt())
							)
						)
					);
				});

				run(function two() {
					if (module.filesystems.cygwin) {
						var a = module.filesystems.os.Pathname("C:\\cygwin\\etc");
						var b = module.filesystems.cygwin.Pathname("/usr/local/bin");
						var searchpath = module.Searchpath([a,b]);
						var upath = module.filesystems.cygwin.toUnix(searchpath);
						var wpath = module.filesystems.cygwin.toWindows(searchpath);
						test( upath.toString() == "/etc:/usr/local/bin" );
						test( wpath.toString() == "C:\\cygwin\\etc;C:\\cygwin\\usr\\local\\bin" );
						test( searchpath.toString() == upath.toString() );
					}
				});

				run(function three() {
					var jpath = module.Searchpath([
						jsh.shell.java.home.getRelativePath("bin")
					]);
					var launcher = jpath.getCommand("java");
					verify(launcher,"$JAVA_HOME/bin/java").is.type("object");
					verify(jpath.getCommand("foobee"),"$JAVA_HOME/bin/foobee").is.type("null");
				});

				run(function parse() {
					var array = [jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname,jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname];
					var searchpath = filesystem.Searchpath(array);
					var searchpathstring = searchpath.toString();
					var parsed = filesystem.Searchpath.parse(searchpathstring);
					test(parsed.pathnames[0].toString() == array[0].toString());
					test(parsed.pathnames[1].toString() == array[1].toString());
					test(parsed.toString() == searchpath.toString());
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Searchpath: {
			//	TODO	should array of directory be allowed? array of string? mixture?
			/**
			 * @param pathnames The list of paths to search.
			 *
			 * @returns A `Searchpath` which searches the given `Pathname`s, in order.
			 */
			(pathnames: slime.jrunscript.file.Pathname[]): Searchpath
			createEmpty: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.Searchpath = function() {
				jsh.shell.console("hey");
			};

			fifty.tests.wip = fifty.tests.Searchpath;
		}
	//@ts-ignore
	)(fifty);


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const jsh = fifty.global.jsh;

			fifty.tests.manual.world = function() {
				var searchpath = jsh.file.Searchpath([
					fifty.jsh.file.object.getRelativePath(".")
				]);
				jsh.shell.console(searchpath.toString());
				jsh.shell.console(String(searchpath.pathnames.length));
				jsh.shell.console(searchpath.pathnames[0].toString());
				jsh.shell.console(String(searchpath.pathnames[0].directory.directory));
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.file.internal.oo {
	export interface Context {
		api: {
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
		}

		library: {
			world: slime.jrunscript.file.internal.java.Exports
			Location: slime.jrunscript.file.location.Exports
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

	export type Exports = Pick<
		slime.jrunscript.file.Exports,
		"filesystems"
		| "filesystem"
		| "Pathname"
		| "navigate"
		| "Searchpath"
		| "Loader"
		| "zip"
		| "unzip"
		| "list"
		| "state"
		| "action"
		| "object"
		| "Streams"
		| "java"
	>

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

				fifty.run(fifty.tests.one);
				fifty.run(fifty.tests.more);

				fifty.run(fifty.tests.filetime);
				fifty.run(fifty.tests.exports);

				fifty.load("oo/file.fifty.ts");
				fifty.load("oo/filesystem.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
