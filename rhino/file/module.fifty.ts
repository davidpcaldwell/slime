//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Context {
		$pwd: string

		/**
		 * A list of file extensions that should be considered "executable." Corresponds to the PATHEXT environment variable
		 * present on Microsoft Windows systems.
		 */
		pathext: string[]
		api: {
			js: any
			java: any
			io: slime.jrunscript.io.Exports
		}

		/**
		 * Data about the Cygwin installation.  If this attribute is present in the scope when this object is loaded, it
		 * will be used to create the `cygwin` property of `filesystems`.
		 */
		cygwin?: {
			/**
			 * The Windows path of the Cygwin root directory.
			 */
			root: string

			/**
			 * The Windows path of the Cygwin path helper executable.
			 */
			paths: string
		}

		addFinalizer: any
	}

	/**
	 * A filesystem implementation from which files may be read and listed and to which files may be written.
	 */
	export interface Filesystem {
		/**
		 * @param value A path name that is valid in this filesystem.
		 *
		 * @returns A Pathname in this filesystem corresponding to the given string.
		 */
		Pathname: (value: string) => Pathname

		/**
		 * Creates a Searchpath in this filesystem.
		 */
		Searchpath: Exports["Searchpath"] & {
			/**
			 * Creates a searchpath in this filesystem from the given string.
			 *
			 * @returns The searchpath represented by the given string.
			 */
			parse: (string: string) => Searchpath
		}

		java: {
			adapt: (_file: slime.jrunscript.native.java.io.File) => slime.jrunscript.file.Pathname
		}

		$unit: any
		$jsh: any
	}

	export interface Exports {
		/**
		 * Implementations of an abstract filesystem API that are available to scripts.
		 */
		filesystems: {
			/**
			 * The underlying operating system's filesystem.
			 */
			os: Filesystem

			/**
			 * A Cygwin file system that interoperates with an underlying Windows file system.
			 *
			 * Present if `$context.cygwin` was specified.
			 */
			cygwin: Filesystem & {
				//	TODO	use slime.Codec rather than toUnix / toWindows?

				/**
				 * Converts filesystem objects from Windows to Cygwin.
				 *
				 * If the argument is a `Pathname`, the Pathname expressed as a Cygwin path will be returned. If it is a
				 * `Searchpath`, the Searchpath expressed as a Cygwin search path will be returned.  Otherwise, the argument is
				 * returned unchanged.
				 */
				toUnix: {
					/**
					 * @param p A Windows `Pathname`.
					 */
					(p: Pathname): Pathname

					/**
					 * @param p A Windows `Searchpath`.
					 */
					(p: Searchpath): Searchpath
				}

				/**
				 * Converts filesystem objects from Cygwin to Windows.
				 *
				 * If the argument is a `Pathname`, the Pathname expressed as a Windows path will be returned. If it is a
				 * `Searchpath`, the Searchpath expressed as a Windows search path will be returned.  Otherwise, the argument is
				 * returned unchanged.
				 */
				 toWindows: {
					/**
					 * @param p A Cygwin `Pathname`.
					 */
					 (p: Pathname): Pathname

					 /**
					  * @param p A Cygwin `Searchpath`.
					  */
					 (p: Searchpath): Searchpath
				}
			}
		}
		/**
		 * The current default filesystem.
		 */
		filesystem: Filesystem
	}

	export interface Exports {
		Pathname: {
			(p: string): Pathname
			createDirectory: {
				exists: {
					LEAVE: (dir: slime.jrunscript.file.Directory) => boolean
					RECREATE: (dir: slime.jrunscript.file.Directory) => boolean
				}
			}
		}
		navigate: (p: { from: Pathname | Node, to: Pathname | Node, base?: Directory }) => { base: Directory, relative: string }
	}

	export interface Exports {
		Filesystem: any
	}

	export interface Exports {
		state: {
			list: (pathname: string) => slime.$api.fp.impure.State<{
				relative: string
				absolute: string
			}[]>
		}

		action: {
			delete: (location: string) => slime.$api.fp.impure.Action<{
				deleted: string
			},void>

			write: {
				(p: {
					location: string
					content: string
					createDirectory?: boolean
					exists: "fail" | "leave" | "overwrite"
				}): slime.$api.fp.impure.Action<{
					wrote: string
				},void>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.state = {};
			fifty.tests.state.list = function() {
				var subject = fifty.global.jsh.file;

				var prefix = fifty.jsh.file.object.getRelativePath(".").toString();
				var lister = subject.state.list(prefix);
				var listing = lister().sort(function(a,b) {
					if (a.relative < b.relative) return -1;
					if (b.relative < a.relative) return 1;
					throw new Error();
				});
				fifty.global.jsh.shell.console(listing.toString());
				//	TODO	brittle; changing structure of module can break it
				fifty.verify(listing)[0].relative.is("_.fifty.ts");
				fifty.verify(listing)[0].absolute.is(prefix + "/" + "_.fifty.ts");
				fifty.verify(listing)[10].relative.is("java/");
				fifty.verify(listing)[10].absolute.is(prefix + "/" + "java/");
			}

			fifty.tests.action = {};
			fifty.tests.action.write = function() {
				var subject = fifty.global.jsh.file;

				var newdir = function() {
					return fifty.global.jsh.shell.TMPDIR.createTemporary({ directory: true });
				}

				var toString = function(p) { return String(p); }

				fifty.run(function create() {
					var tmpdir = newdir();

					var action = subject.action.write({
						location: tmpdir.getRelativePath("foo").toString(),
						content: "bar",
						exists: "fail"
					});

					var captor = fifty.$api.Events.Captor({
						wrote: "string"
					});

					fifty.verify(tmpdir).getFile("bar").is.type("null");

					action(captor.handler);

					fifty.verify(captor).events.length.is(1);
					fifty.verify(captor).events[0].type.is("wrote");
					var event: $api.Event<string> = captor.events[0];
					fifty.verify(event).detail.evaluate(toString).is("bar");
					fifty.verify(tmpdir).getFile("foo").is.type("object");
					var readString = function(p: File) { return p.read(String); }
					fifty.verify(tmpdir).getFile("foo").evaluate(readString).evaluate(toString).is("bar");
				});

				fifty.run(function existsFail() {
					var tmpdir = newdir();

					subject.action.write({
						location: tmpdir.getRelativePath("foo").toString(),
						content: "bar",
						exists: "fail"
					})();

					var second = subject.action.write({
						location: tmpdir.getRelativePath("foo").toString(),
						content: "bar",
						exists: "fail"
					});

					fifty.verify(second).evaluate(function(f) { return f(); }).threw.type(Error);
				});

				fifty.run(function existsLeave() {
					var tmpdir = newdir();

					subject.action.write({
						location: tmpdir.getRelativePath("foo").toString(),
						content: "bar",
						exists: "fail"
					})();

					subject.action.write({
						location: tmpdir.getRelativePath("foo").toString(),
						content: "baz",
						exists: "leave"
					})();

					var readString = function(p: slime.jrunscript.file.File): string { return p.read(String); }

					fifty.verify(tmpdir).getFile("foo").evaluate(readString).evaluate(toString).is("bar");
				});

				fifty.run(function existsOverwrite() {
					var tmpdir = newdir();

					subject.action.write({
						location: tmpdir.getRelativePath("foo").toString(),
						content: "bar",
						exists: "fail"
					})();

					subject.action.write({
						location: tmpdir.getRelativePath("foo").toString(),
						content: "baz",
						exists: "overwrite"
					})();

					var readString = function(file: slime.jrunscript.file.File) { return file.read(String); }

					fifty.verify(tmpdir).getFile("foo").evaluate(readString).evaluate(toString).is("baz");
				});

				fifty.run(function noCreateDirectory() {
					var tmpdir = newdir();

					var action = subject.action.write({
						location: tmpdir.getRelativePath("a/b").toString(),
						content: "foo",
						exists: "fail"
					});

					fifty.verify(action).evaluate(function(f) { return f(); }).threw.type(Error);
				});

				fifty.run(function createDirectory() {
					var tmpdir = newdir();

					var action = subject.action.write({
						location: tmpdir.getRelativePath("a/b").toString(),
						content: "foo",
						exists: "fail",
						createDirectory: true
					});

					fifty.verify(action).evaluate(function(f) { return f(); }).threw.nothing();
				});
			}

			fifty.tests.action.delete = function() {
				var subject = fifty.global.jsh.file;

				var dir = fifty.jsh.file.object.temporary.directory();
				dir.getRelativePath("file").write("foo", { append: false });
				fifty.verify(dir).getFile("file").is.type("object");
				var d2 = subject.action.delete(dir.getRelativePath("file").toString());
				fifty.verify(dir).getFile("file").is.type("object");
				var events: slime.$api.Event<string>[] = [];
				d2({
					deleted: function(e) {
						events.push(e);
					}
				});
				fifty.verify(dir).getFile("file").is.type("null");
				fifty.verify(events).length.is(1);
				fifty.verify(events)[0].detail.is(dir.getRelativePath("file").toString());
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			Packages: slime.jrunscript.Packages,
			jsh: slime.jsh.Global,
			tests: slime.fifty.test.tests,
			verify: slime.fifty.test.verify,
			fifty: slime.fifty.test.Kit
		) {
			var MODIFIED_TIME = new jsh.time.When({ unix: 1599862384355 });

			tests.filetime = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.directory;
				directory.getRelativePath("file").write("foo");
				var file = directory.getFile("file");

				file.modified = jsh.time.When.codec.Date.encode(MODIFIED_TIME);
				var isNearestSecond = file.modified.getTime() == Math.floor(MODIFIED_TIME.unix / 1000) * 1000;
				var isMillisecond = file.modified.getTime() == MODIFIED_TIME.unix;
				verify(isNearestSecond || isMillisecond, "sNearestSecond || isMillisecond").is(true);
			}

			tests.filetime.testbed = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.directory;
				directory.getRelativePath("file").write("foo");
				var file = directory.getFile("file");

				var nio = file.pathname.java.adapt().toPath();
				jsh.shell.console(String(nio));
				Packages.java.nio.file.Files.setLastModifiedTime(nio, Packages.java.nio.file.attribute.FileTime.fromMillis(MODIFIED_TIME.unix));
				var _modified = Packages.java.nio.file.Files.getLastModifiedTime(nio);
				jsh.shell.console(_modified.toMillis());
			}

			tests.exports = {
				navigate: function() {
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
		}
	//@ts-ignore
	)(Packages,global.jsh,tests,verify,fifty);

	export namespace world {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { run } = fifty;

				fifty.tests.sandbox = {};

				fifty.tests.sandbox.filesystem = function() {
					run(fifty.tests.sandbox.filesystem.Pathname.relative);
					run(fifty.tests.sandbox.filesystem.Pathname.isDirectory);
					run(fifty.tests.sandbox.filesystem.File.read);
					run(fifty.tests.sandbox.filesystem.Directory.require);
					run(fifty.tests.sandbox.filesystem.Directory.remove);
					run(fifty.tests.sandbox.filesystem.pathname.file.write.string);
					run(fifty.tests.sandbox.filesystem.pathname.file.read.string);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Pathname {
			readonly filesystem: Filesystem
			readonly pathname: string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.sandbox.filesystem.pathname = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Pathname {
			relative: (relative: string) => Pathname
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const { world } = jsh.file;
				const filesystem = world.filesystems.os;

				fifty.tests.sandbox.filesystem.pathname.relative = function() {
					var parent = filesystem.pathname(fifty.jsh.file.object.getRelativePath(".").toString());
					var relative = "module.fifty.ts";
					var result = parent.relative(relative);
					verify(result).is.type("object");
					verify(result).relative.is.type("function");
					verify(result).pathname.evaluate($api.Function.string.endsWith("module.fifty.ts")).is(true);
					result = parent.relative("foo");
					verify(result).is.type("object");
					verify(result).relative.is.type("function");
					verify(result).pathname.evaluate($api.Function.string.endsWith("module.fifty.ts")).is(false);
					verify(result).pathname.evaluate($api.Function.string.endsWith("foo")).is(true);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Directory {
			require: (p?: {
				recursive?: boolean
			}) => slime.$api.fp.impure.Tell<void>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				const { $api, jsh } = fifty.global;
				const subject = jsh.file;
				const filesystem = subject.world.filesystems.os;

				fifty.tests.sandbox.filesystem.pathname.directory = {};

				fifty.tests.sandbox.filesystem.pathname.directory.require = function() {
					run(function recursiveRequired() {
						var TMPDIR = jsh.shell.TMPDIR.createTemporary({ directory: true });
						var tmpdir = filesystem.pathname(TMPDIR.toString());
						var destination = tmpdir.relative("foo/bar");

						verify(TMPDIR).getSubdirectory("foo/bar").is.type("null");

						verify(destination.directory).evaluate(function(subject) {
							return subject.require()();
						}).threw.type(Error);

						verify(TMPDIR).getSubdirectory("foo/bar").is.type("null");

						verify(destination.directory).evaluate(function(subject) {
							return subject.require({
								recursive: true
							})();
						}).threw.nothing();

						verify(TMPDIR).getSubdirectory("foo/bar").is.type("object");
					});

					run(function createsOnce() {
						var TMPDIR = jsh.shell.TMPDIR.createTemporary({ directory: true });
						var tmpdir = filesystem.pathname(TMPDIR.toString());
						var destination = tmpdir.relative("foo");

						verify(TMPDIR).getSubdirectory("foo").is(null);

						destination.directory.require()();

						verify(TMPDIR).getSubdirectory("foo").is.type("object");
						verify(TMPDIR).getSubdirectory("foo").getFile("a").is.type("null");

						TMPDIR.getSubdirectory("foo").getRelativePath("a").write("", { append: false });

						verify(TMPDIR).getSubdirectory("foo").is.type("object");
						verify(TMPDIR).getSubdirectory("foo").getFile("a").is.type("object");

						destination.directory.require()();

						verify(TMPDIR).getSubdirectory("foo").is.type("object");
						//	verify it was not recreated
						verify(TMPDIR).getSubdirectory("foo").getFile("a").is.type("object");
					})
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Directory {
			/**
			 * Removes the directory at the given location. If there is nothing at the given location, will fire the `notFound`
			 * event and return.
			 */
			remove: () => slime.$api.fp.impure.Tell<{
				notFound: void
			}>

			exists: () => slime.$api.fp.impure.Ask<{},boolean>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.sandbox.filesystem.pathname.file = {};
			}
		//@ts-ignore
		)(fifty);


		export interface File {
			exists: () => slime.$api.fp.impure.Ask<{},boolean>

			write: {
				string: (p: {
					content: string
				}) => slime.$api.fp.impure.Tell<{
				}>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { jsh } = fifty.global;
				const filesystem = jsh.file.world.filesystems.os;

				fifty.tests.sandbox.filesystem.pathname.file.write = {};
				fifty.tests.sandbox.filesystem.pathname.file.write.string = function() {
					var TMPDIR = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var read = function(at: Pathname): string {
						var file = jsh.file.Pathname(at.pathname).file;
						return (file) ? file.read(String) : null;
					}
					var at = filesystem.pathname(TMPDIR.toString()).relative("a");
					verify(read(at)).is(null);
					at.file.write.string({ content: "foo" })();
					verify(read(at)).is("foo");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface File {
			read: {
				stream: {
					bytes: () => slime.$api.fp.impure.Ask<{
						notFound: void
					},slime.jrunscript.runtime.io.InputStream>
				}

				/**
				 * Returns an `Ask` that returns the contents of the file as a string, or `null` if the file does not exist.
				 * The `Ask` also provides a `notFound` event to allow special handling of the case in which the file does not
				 * exist.
				 */
				string: () => slime.$api.fp.impure.Ask<{
					notFound: void
				},string>
			}

			//	TODO	no tests
			/**
			 * @experimental May want to copy to another more general location, not just a path in the same filesystem
			 */
			copy: (p: {
				to: string
			}) => slime.$api.fp.impure.Tell<void>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { jsh } = fifty.global;
				const here = jsh.file.world.filesystems.os.pathname(fifty.jsh.file.object.getRelativePath(".").toString());

				fifty.tests.sandbox.filesystem.pathname.file.read = {};
				fifty.tests.sandbox.filesystem.pathname.file.read.string = function() {
					const readString = function(p: slime.jrunscript.file.world.Pathname): string {
						return p.file.read.string()();
					}
					verify(here).relative("module.fifty.ts").evaluate(readString).is.type("string");
					verify(here).relative("foobar.fifty.ts").evaluate(readString).is.type("null");
				}
			}
		//@ts-ignore
		)(fifty);


		export interface Pathname {
			file: File
			directory: Directory
		}

		export interface Filesystem {
			pathname: (pathname: string) => Pathname

			/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
			Pathname: {
				/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
				relative: (parent: string, relative: string) => string

				/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
				isDirectory: (pathname: string) => boolean
			}

			/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
			File: {
				/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
				read: {
					/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
					stream: {
						/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
						bytes: (pathname: string) => slime.$api.fp.impure.Ask<{
							notFound: void
						},slime.jrunscript.runtime.io.InputStream>
					}

					/**
					 * @deprecated Use .pathname() to obtain a {@link Pathname}.
					 *
					 * Returns an `Ask` that returns the contents of the file as a string, or `null` if the file does not exist.
					 * The `Ask` also provides a `notFound` event to allow special handling of the case in which the file does not
					 * exist.
					 */
					string: (pathname: string) => slime.$api.fp.impure.Ask<{
						notFound: void
					},string>
				}

				/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
				copy: (p: {
					from: string
					to: string
				}) => slime.$api.fp.impure.Tell<void>
			}

			/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
			Directory: {
				/** @deprecated Use .pathname() to obtain a {@link Pathname}. */
				require: (p: {
					pathname: string
					recursive?: boolean
				}) => slime.$api.fp.impure.Tell<void>

				/**
				 * @deprecated Use .pathname() to obtain a {@link Pathname}.
				 *
				 * Removes the directory at the given location. If there is nothing at the given location, will fire the `notFound`
				 * event and return.
				 */
				remove: (p: {
					pathname: string
				}) => slime.$api.fp.impure.Tell<{
					notFound: void
				}>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				const { jsh } = fifty.global;
				const { world } = jsh.file;
				const filesystem = world.filesystems.os;

				fifty.tests.sandbox.filesystem.Pathname = {
					relative: function() {
						//	TODO	the below tests may have been in the wrong place
						var pathname = function(relative: string) { return fifty.jsh.file.object.getRelativePath(relative).toString(); };
						var thisFile = pathname("module.fifty.ts");
						var doesNotExist = pathname("foo");
						verify(filesystem.File.read.string(thisFile)(), "thisFile").is.type("string");
						verify(filesystem.File.read.string(doesNotExist)()).is.type("null");
					},
					isDirectory: function() {
						var parent = fifty.jsh.file.object.getRelativePath(".").toString();
						var cases = {
							parent: parent,
							thisFile: filesystem.Pathname.relative(parent, "module.fifty.ts"),
							nothing: filesystem.Pathname.relative(parent, "foo"),
							subfolder: filesystem.Pathname.relative(parent, "java")
						};
						var isDirectory = function(property) {
							return function(cases) { return filesystem.Pathname.isDirectory(cases[property]); };
						}

						verify(cases).evaluate(isDirectory("parent")).is(true);
						verify(cases).evaluate(isDirectory("thisFile")).is(false);
						verify(cases).evaluate(isDirectory("nothing")).is(false);
						verify(cases).evaluate(isDirectory("subfolder")).is(true);
					}
				};

				var here = fifty.jsh.file.object.getRelativePath(".").toString();

				fifty.tests.sandbox.filesystem.File = {};

				fifty.tests.sandbox.filesystem.File.read = function() {
					var me = filesystem.Pathname.relative(here, "module.fifty.ts");
					var nothing = filesystem.Pathname.relative(here, "nonono");
					var code = filesystem.File.read.string(me)();
					verify(code,"code").is.type("string");
					var no = filesystem.File.read.string(nothing)();
					verify(no,"no").is.type("null");
				}

				fifty.tests.sandbox.filesystem.Directory = {};

				fifty.tests.sandbox.filesystem.Directory.require = function() {
					run(function recursiveRequired() {
						var TMPDIR = jsh.shell.TMPDIR.createTemporary({ directory: true });
						var destination = filesystem.Pathname.relative(TMPDIR.toString(), "foo/bar");

						verify(TMPDIR).getSubdirectory("foo/bar").is.type("null");

						verify(filesystem.Directory).evaluate(function(subject) {
							return subject.require({
								pathname: destination
							})();
						}).threw.type(Error);

						verify(TMPDIR).getSubdirectory("foo/bar").is.type("null");

						verify(filesystem.Directory).evaluate(function(subject) {
							return subject.require({
								pathname: destination,
								recursive: true
							})();
						}).threw.nothing();

						verify(TMPDIR).getSubdirectory("foo/bar").is.type("object");
					});

					run(function createsOnce() {
						var TMPDIR = jsh.shell.TMPDIR.createTemporary({ directory: true });
						var destination = filesystem.Pathname.relative(TMPDIR.toString(), "foo");

						verify(TMPDIR).getSubdirectory("foo").is(null);

						filesystem.Directory.require({
							pathname: destination
						})();

						verify(TMPDIR).getSubdirectory("foo").is.type("object");
						verify(TMPDIR).getSubdirectory("foo").getFile("a").is.type("null");

						TMPDIR.getSubdirectory("foo").getRelativePath("a").write("", { append: false });

						verify(TMPDIR).getSubdirectory("foo").is.type("object");
						verify(TMPDIR).getSubdirectory("foo").getFile("a").is.type("object");

						filesystem.Directory.require({
							pathname: destination
						})();

						verify(TMPDIR).getSubdirectory("foo").is.type("object");
						//	verify it was not recreated
						verify(TMPDIR).getSubdirectory("foo").getFile("a").is.type("object");
					})
				}

				fifty.tests.sandbox.filesystem.Directory.remove = function() {
					var TMPDIR = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var location = filesystem.Pathname.relative(TMPDIR.toString(), "toRemove");
					var exists = function(location) {
						return filesystem.Pathname.isDirectory(location);
					}
					verify(location).evaluate(exists).is(false);
					filesystem.Directory.require({
						pathname: location
					})();
					verify(location).evaluate(exists).is(true);
					filesystem.Directory.remove({
						pathname: location
					})();
					verify(location).evaluate(exists).is(false);

					var doesNotExist = filesystem.Pathname.relative(TMPDIR.toString(), "notThere");
					verify(doesNotExist).evaluate(exists).is(false);
					filesystem.Directory.remove({
						pathname: doesNotExist
					})();
					verify(doesNotExist).evaluate(exists).is(false);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface World {
		filesystems: {
			os: world.Filesystem
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.filetime);
				fifty.run(fifty.tests.exports.navigate);
				fifty.run(fifty.tests.state.list);
				fifty.run(fifty.tests.action.delete);
				fifty.run(fifty.tests.sandbox.filesystem);

				fifty.load("module-Searchpath.fifty.ts");
				fifty.load("module-node.fifty.ts");
				fifty.load("module-Loader.fifty.ts");

				fifty.load("file.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		world: World
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;
			const { world } = jsh.file;

			fifty.tests.world = function() {
				var pathname = fifty.jsh.file.object.getRelativePath("module.fifty.ts").toString();
				jsh.shell.console(world.filesystems.os.File.read.string(pathname)().substring(0,500));

				var folder = fifty.jsh.file.object.getRelativePath(".").toString();
				var file = "module.fifty.ts";
				var relative = world.filesystems.os.Pathname.relative(folder, file);
				jsh.shell.console(relative);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		object: {
			pathname: (pathname: slime.jrunscript.file.world.Pathname) => slime.jrunscript.file.Pathname
			directory: (pathname: slime.jrunscript.file.world.Pathname) => slime.jrunscript.file.Directory
		}
	}

	export interface Exports {
		/** @deprecated Use {@link slime.jrunscript.io.Exports["archive"]["zip"]["encode"] } */
		zip: any
		/** @deprecated Use {@link slime.jrunscript.io.Exports["archive"]["zip"]["decode"] } */
		unzip: any

		/** @deprecated Use the {@link slime.jrunscript.io.Exports} provided by the platform. */
		Streams: slime.jrunscript.io.Exports["Streams"]
		/** @deprecated Use the {@link slime.jrunscript.io.Exports} provided by the platform. */
		java: slime.jrunscript.io.Exports["java"]
		/** @deprecated Covered by {@link slime.jrunscript.shell.Exports["PWD"]} */
		workingDirectory: slime.jrunscript.file.Directory
	}

	export type Script = slime.loader.Script<Context,Exports>
}
