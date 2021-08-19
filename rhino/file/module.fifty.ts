//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Pathname {
		directory: Directory
		basename: string
		parent: Pathname
		createDirectory: (p?: { exists?: (d: Directory) => boolean, recursive?: boolean } ) => Directory
		write: (content: any, mode?: any) => any
		file: File
		java: {
			adapt: () => slime.jrunscript.native.java.io.File
		}
	}

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
		getRelativePath: (string) => Pathname,
		getFile: (string) => File,
		getSubdirectory: (string) => Directory,
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

	interface Searchpath {
		getCommand: any
	}

	export interface Exports {
		//	TODO	would be nice to get rid of string below, but right now it's unknown exactly how to access MimeType from
		//			jsh/browser/servlet environments
		Loader: new (p: { directory: Directory, type?: (path: slime.jrunscript.file.File) => (slime.mime.Type | string) }) => slime.Loader
		Pathname: {
			(p: string): Pathname
			createDirectory: any
		}
		Searchpath: {
			(pathnames: slime.jrunscript.file.Pathname[]): Searchpath
			createEmpty: any
		}
		filesystem: any
		filesystems: any
		navigate: (p: { from: Pathname | Node, to: Pathname | Node, base?: Directory }) => { base: Directory, relative: string }
		Filesystem: any
		Streams: any
		java: any
		zip: any
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
				fifty.verify(listing)[0].relative.is("api.Loader.html");
				fifty.verify(listing)[0].absolute.is(prefix + "/" + "api.Loader.html");
				fifty.verify(listing)[9].relative.is("java/");
				fifty.verify(listing)[9].absolute.is(prefix + "/" + "java/");
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
					fifty.verify(captor).events[0].detail.evaluate(toString).is("bar");
					fifty.verify(tmpdir).getFile("foo").is.type("object");
					fifty.verify(tmpdir).getFile("foo").read(String).evaluate(toString).is("bar");
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

					fifty.verify(tmpdir).getFile("foo").read(String).evaluate(toString).is("bar");
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

					fifty.verify(tmpdir).getFile("foo").read(String).evaluate(toString).is("baz");
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
}

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

		tests.suite = function() {
			fifty.run(tests.filetime);
			fifty.run(tests.exports.navigate);
			fifty.run(tests.state.list);
			fifty.run(tests.action.delete);
		}
	}
//@ts-ignore
)(Packages,global.jsh,tests,verify,fifty);
