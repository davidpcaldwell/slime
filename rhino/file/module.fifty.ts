//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Node {
		pathname: Pathname
		directory: boolean
		remove: () => void,
		parent: Directory,
		move: any
		copy: (
			pathname: Pathname | Directory,
			mode?: {
				filter?: (p: {
					entry: {
						path: string
						node: slime.jrunscript.file.Node
					},
					exists: slime.jrunscript.file.Node
				}) => boolean

				recursive?: any
			}
		) => Node
	}

	export interface File extends Node {
		read: {
			(p: StringConstructor): string
			(p: any): any
		}
		length: any
		modified: Date
	}

	export namespace directory {
		export interface Entry<T> {
			filter?: (child: Node) => boolean
			create: (self: Directory, child: Node) => T
		}
	}

	export interface Directory extends Node {
		getRelativePath: (path: string) => Pathname
		getFile: (path: string) => File
		getSubdirectory: (path: string) => Directory
		createTemporary: {
			(p: { directory: true, prefix?: string, suffix?: string }): Directory
			(p?: { directory?: false, prefix?: string, suffix?: string }): File
		}
		list: {
			<T>(mode?: {
				type?: directory.Entry<T>
				filter?: any
				descendants?: any

				/** @deprecated */
				recursive?: any
			}): T[]

			(mode?: {
				filter?: any
				descendants?: any

				/** @deprecated */
				recursive?: any
			}): Node[]

			RESOURCE: directory.Entry<any>
			ENTRY: directory.Entry<any>
		}
	}

	export interface Context {
		$pwd: string
		pathext: string[]
		api: {
			js: any
			java: any
			io: slime.jrunscript.io.Exports
		}
		cygwin: any
		addFinalizer: any
	}

	export interface Exports {
		filesystems: any
		filesystem: any
	}

	export interface Exports {
		Pathname: {
			(p: string): Pathname
			createDirectory: any
		}
		navigate: (p: { from: Pathname | Node, to: Pathname | Node, base?: Directory }) => { base: Directory, relative: string }
	}

	export interface Searchpath {
		pathnames: slime.jrunscript.file.Pathname[]
		getCommand: any
	}

	export interface Exports {
		Searchpath: {
			(pathnames: slime.jrunscript.file.Pathname[]): Searchpath
			createEmpty: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const jsh = fifty.global.jsh;

			fifty.tests.Searchpath = {};
			fifty.tests.Searchpath.world = function() {
				var searchpath = jsh.file.Searchpath([
					fifty.$loader.getRelativePath(".")
				]);
				jsh.shell.console(searchpath.toString());
				jsh.shell.console(String(searchpath.pathnames.length));
				jsh.shell.console(searchpath.pathnames[0].toString());
				jsh.shell.console(String(searchpath.pathnames[0].directory.directory));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		//	TODO	would be nice to get rid of string below, but right now it's unknown exactly how to access MimeType from
		//			jsh/browser/servlet environments
		Loader: new (p: { directory: Directory, type?: (path: slime.jrunscript.file.File) => (slime.mime.Type | string) }) => slime.Loader
		Filesystem: any

		/** @deprecated Use {@link slime.jrunscript.io.Exports["archive"]["zip"]["encode"] } */
		zip: any
		/** @deprecated Use {@link slime.jrunscript.io.Exports["archive"]["zip"]["decode"] } */
		unzip: any

		list: {
			NODE: slime.jrunscript.file.directory.Entry<slime.jrunscript.file.Node>,
			ENTRY: slime.jrunscript.file.directory.Entry<{ path: string, node: slime.jrunscript.file.Node }>,
			RESOURCE: slime.jrunscript.file.directory.Entry<{ path: string, resource: slime.jrunscript.file.File }>
		}
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
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.state = {};
			fifty.tests.state.list = function() {
				var subject = fifty.global.jsh.file;

				var prefix = fifty.$loader.getRelativePath(".").toString();
				var lister = subject.state.list(prefix);
				var listing = lister().sort(function(a,b) {
					if (a.relative < b.relative) return -1;
					if (b.relative < a.relative) return 1;
					throw new Error();
				});
				fifty.global.jsh.shell.console(listing.toString());
				//	TODO	brittle; changing structure of module can break it
				fifty.verify(listing)[0].relative.is("api.Loader.html");
				fifty.verify(listing)[0].absolute.is(prefix + "/" + "api.Loader.html");
				fifty.verify(listing)[12].relative.is("java/");
				fifty.verify(listing)[12].absolute.is(prefix + "/" + "java/");
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

				var dir = fifty.jsh.file.directory();
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
			fifty: slime.fifty.test.kit
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
		export interface Filesystem {
			Pathname: {
				relative: (parent: string, relative: string) => string

				isDirectory: (pathname: string) => boolean
			}

			File: {
				read: {
					stream: {
						bytes: (pathname: string) => slime.$api.fp.impure.Ask<{
							notFound: void
						},slime.jrunscript.runtime.io.InputStream>
					}

					string: (pathname: string) => slime.$api.fp.impure.Ask<{
						notFound: void
					},string>
				}

				//	TODO	no tests
				copy: (p: {
					from: string
					to: string
				}) => slime.$api.fp.impure.Tell<void>
			}

			Directory: {
				require: (p: {
					pathname: string
					recursive?: boolean
				}) => slime.$api.fp.impure.Tell<void>
			}
		}

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				const { verify, run } = fifty;
				const { jsh } = fifty.global;
				const { world } = jsh.file;
				const filesystem = world.filesystems.os;

				fifty.tests.sandbox = {};

				fifty.tests.sandbox.filesystem = function() {
					run(fifty.tests.sandbox.filesystem.Pathname.relative);
					run(fifty.tests.sandbox.filesystem.Pathname.isDirectory);
					run(fifty.tests.sandbox.filesystem.Directory.require);
				}

				fifty.tests.sandbox.filesystem.Pathname = {
					relative: function() {
						var parent = fifty.$loader.getRelativePath(".").toString();
						var relative = "module.fifty.ts";
						var result = filesystem.Pathname.relative(parent, relative);
						verify(result).is.type("string");
						result = filesystem.Pathname.relative(parent, "foo");
						verify(result).is.type("string");

						var pathname = function(relative: string) { return fifty.$loader.getRelativePath(relative).toString(); };
						var thisFile = pathname("module.fifty.ts");
						var doesNotExist = pathname("foo");
						verify(filesystem.File.read.string(thisFile)(), "thisFile").is.type("string");
						verify(filesystem.File.read.string(doesNotExist)()).is.type("null");
					},
					isDirectory: function() {
						var parent = fifty.$loader.getRelativePath(".").toString();
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
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.filetime);
				fifty.run(fifty.tests.exports.navigate);
				fifty.run(fifty.tests.state.list);
				fifty.run(fifty.tests.action.delete);
				fifty.run(fifty.tests.sandbox.filesystem);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { jsh } = fifty.global;
			const { world } = jsh.file;

			fifty.tests.world = function() {
				var pathname = fifty.$loader.getRelativePath("module.fifty.ts").toString();
				jsh.shell.console(world.filesystems.os.File.read.string(pathname)().substring(0,500));

				var folder = fifty.$loader.getRelativePath(".").toString();
				var file = "module.fifty.ts";
				var relative = world.filesystems.os.Pathname.relative(folder, file);
				jsh.shell.console(relative);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		world: World
	}

	export interface Exports {
		/** @deprecated Use the {@link slime.jrunscript.io.Exports} provided by the platform. */
		Streams: slime.jrunscript.io.Exports["Streams"]
		/** @deprecated Use the {@link slime.jrunscript.io.Exports} provided by the platform. */
		java: slime.jrunscript.io.Exports["java"]
		/** @deprecated Covered by {@link slime.jrunscript.shell.Exports["PWD"]} */
		workingDirectory: slime.jrunscript.file.Directory
	}

	export type Script = slime.loader.Script<Context,Exports>
}
