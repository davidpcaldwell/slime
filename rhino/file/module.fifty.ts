//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Context {
		/**
		 * A list of file extensions that should be considered "executable." Corresponds to the PATHEXT environment variable
		 * present on Microsoft Windows systems.
		 */
		pathext: string[]

		api: {
			/**
			 * @deprecated
			 */
			js: slime.$api.old.Exports
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
			loader: {
				Store: slime.runtime.loader.Exports["Store"]
			}
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
			/**
			 * Creates objects that represent a path in the local file system; attempts to 'cast' an argument to a {@link Pathname}.
			 *
			 * @param p An argument to be converted to a Pathname.  If the argument is a `string`, the argument will be interpreted
			 * literally as a path in the local filesystem.  If the argument is an object, its `toString` method will be invoked and
			 * the result will be interpreted as a path in the local filesystem.
			 *
			 * @returns The pathname represented by the argument.
			 */
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
		state: {
			list: (pathname: string) => slime.$api.fp.world.old.Ask<void, {
				relative: string
				absolute: string
			}[]>
		}

		action: {
			delete: (location: string) => slime.$api.fp.world.old.Operation<{
				deleted: string
			},void>

			write: {
				(p: {
					location: string
					content: string
					createDirectory?: boolean
					exists: "fail" | "leave" | "overwrite"
				}): slime.$api.fp.world.old.Operation<{
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
				fifty.verify(listing)[6].relative.is("java/");
				fifty.verify(listing)[6].absolute.is(prefix + "/" + "java/");
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
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.filetime);
				fifty.run(fifty.tests.state.list);
				fifty.run(fifty.tests.action.delete);

				fifty.load("world-old.fifty.ts");
				fifty.load("mock.fifty.ts");
				fifty.load("wo.fifty.ts");

				fifty.load("loader.fifty.ts");

				fifty.load("oo.fifty.ts");
				fifty.load("oo/file.fifty.ts");

				fifty.load("module-Searchpath.fifty.ts");
				fifty.load("module-node.fifty.ts");
				fifty.load("module-Loader.fifty.ts");

				fifty.load("module-jsapi.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		object: {
			pathname: (pathname: slime.jrunscript.file.world.Location) => slime.jrunscript.file.Pathname
			directory: (pathname: slime.jrunscript.file.world.Location) => slime.jrunscript.file.Directory
		}
	}

	export namespace world {
		/** @deprecated Replaced by slime.jrunscript.file.Location. */
		export type Location = slime.jrunscript.file.Location
	}


	export interface Exports {
		world: {
			filesystems: {
				os: world.Filesystem

				/**
				 * Produces a mock filesystem implementation that operates in memory only.
				 *
				 * @param p
				 * @returns
				 */
				mock: (p?: {
					separator?: {
						pathname?: string
						searchpath?: string
					}
				}) => world.Filesystem
			}

			/** @deprecated Replaced by direct `Location` property. */
			Location: exports.Location
		}

		mock: {
			/** @deprecated Use `Exports["world"]["filesystems"]["mock"]. */
			filesystem: Exports["world"]["filesystems"]["mock"]
		}
	}

	export interface Exports {
		archive: slime.jrunscript.file.archive.Exports
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
	}

	export type Script = slime.loader.Script<Context,Exports>
}
