//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface World {
		os: {
			Location: (pathname: string) => world.Location
		}
	}

	export namespace world {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { run } = fifty;

				fifty.tests.sandbox = fifty.test.Parent();

				fifty.tests.sandbox.filesystem = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Location {
			readonly filesystem: Filesystem
			readonly pathname: string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.sandbox.locations = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Locations {
			relative: (path: string) => (p: world.Location) => world.Location
			parent: () => (p: world.Location) => world.Location

			file: {
				exists: () => slime.$api.fp.world.Question<world.Location, {}, boolean>

				read: {
					stream: () => slime.$api.fp.world.Question<world.Location, {
						notFound: void
					}, slime.$api.fp.Maybe<slime.jrunscript.runtime.io.InputStream>>

					string: () => slime.$api.fp.world.Question<world.Location, {
						notFound: void
					}, slime.$api.fp.Maybe<string>>
				}

				write: {
					string: (p: {
						value: string
					}) => slime.$api.fp.world.Action<world.Location, {
					}>

					stream: (p: {
						input: slime.jrunscript.runtime.io.InputStream
					}) => slime.$api.fp.world.Action<world.Location, {
					}>
				}

				copy: (p: {
					to: world.Location
				}) => slime.$api.fp.world.Action<world.Location, {}>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const subject = jsh.file.world;

				fifty.tests.sandbox.locations.file = function() {
					fifty.run(function exists() {
						var at = fifty.jsh.file.temporary.location();

						var exists = $api.Function.world.question(subject.Location.file.exists());

						verify(exists(at)).is(false);

						var writeA = $api.Function.world.action(subject.Location.file.write.string({ value: "a" }));

						$api.Function.impure.now.output(at, writeA);

						verify(exists(at)).is(true);
					});

					fifty.run(function binary() {
						var at = fifty.jsh.file.temporary.location();

						var buffer = new jsh.io.Buffer();
						buffer.writeText().write("text");
						buffer.close();

						var process = $api.Function.world.tell(
							subject.Location.file.write.stream({ input: buffer.readBinary() })(at)
						);

						process();

						var getText = $api.Function.world.ask(
							subject.Location.file.read.string()(at)
						);

						var maybeText = getText();

						if (maybeText.present) {
							verify(maybeText.value).is("text");
						} else {
							verify(false).is(true);
						}
					});

					fifty.run(function copy() {
						var from = fifty.jsh.file.temporary.location();
						var to = fifty.jsh.file.temporary.location();

						var writeText = $api.Function.world.action(
							jsh.file.world.Location.file.write.string({ value: "tocopy" })
						);

						var readText = $api.Function.pipe(
							$api.Function.world.question(
								jsh.file.world.Location.file.read.string()
							),
							$api.Function.Maybe.map(function(s) { return s; }),
							$api.Function.Maybe.else(function(): string { return null; })
						);

						var exists = $api.Function.world.question(
							jsh.file.world.Location.file.exists()
						);

						verify(readText(from)).is(null);
						writeText(from);
						verify(readText(from)).is("tocopy");

						verify(exists(to)).is(false);
						verify(readText(to)).is(null);

						var copy = $api.Function.world.action(jsh.file.world.Location.file.copy({ to: to }));
						copy(from);

						verify(exists(to)).is(true);
						verify(readText(to)).is("tocopy");
					});
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Locations {
			directory: {
				exists: () => slime.$api.fp.world.Question<world.Location, {}, boolean>

				require: (p?: { recursive?: boolean }) => slime.$api.fp.world.Action<world.Location, {
				}>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const subject = jsh.file.world;

				fifty.tests.sandbox.locations.directory = function() {
					var at = fifty.jsh.file.temporary.location();

					var exists = $api.Function.world.question(subject.Location.directory.exists());

					verify(exists(at)).is(false);

					$api.Function.world.tell(subject.Location.directory.require()(at))();
					verify(exists(at)).is(true);

					$api.Function.world.tell(subject.Location.directory.require()(at))();
					verify(exists(at)).is(true);
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export interface World {
		Location: world.Locations
	}

	export namespace world {

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.sandbox.filesystem.pathname = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export namespace object {
			export interface Location extends world.Location {
				/**
				 * @deprecated Not world-oriented.
				 */
				relative: (relative: string) => object.Location
			}
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

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.sandbox.filesystem.pathname.directory = {};
			}
		//@ts-ignore
		)(fifty);

		export interface Directory {
			require: (p?: {
				recursive?: boolean
			}) => slime.$api.fp.world.old.Tell<void>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				const { $api, jsh } = fifty.global;
				const subject = jsh.file;
				const filesystem = subject.world.filesystems.os;

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
			list: () => slime.$api.fp.world.old.Ask<void,Location[]>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				fifty.tests.sandbox.filesystem.pathname.directory.list = function() {
					var TMPDIR = fifty.jsh.file.temporary.directory();
					verify(TMPDIR).directory.evaluate(function(i) { return i.exists()(); }).is(true);
					//	TODO	below function threw an exception at one point, but it just returns undefined because of the hacks
					//			supporting .threw
					verify(TMPDIR).directory.evaluate(function(i) { return i.list()(); }).length.is(0);
					TMPDIR.relative("a").file.write.string({ content: "foo" })();
					verify(TMPDIR).directory.evaluate(function(i) { return i.list()(); }).length.is(1);
					TMPDIR.relative("b").directory.require()();
					verify(TMPDIR).directory.evaluate(function(i) { return i.list()(); }).length.is(2);

					function matches(a: slime.jrunscript.file.world.Location, b: slime.jrunscript.file.world.Location): boolean {
						return a.pathname == b.pathname;
					}

					//	TODO	push back into Fifty, or farther
					function isSameSet<L,R>(ls: L[], rs: R[], match: (l: L, r: R) => boolean): boolean {
						var matched = $api.Iterable.match({
							left: ls,
							right: rs,
							matches: match
						});
						return matched.unmatched.left.length == 0 && matched.unmatched.right.length == 0;
					}

					var actual = TMPDIR.directory.list()();
					var expected = [
						TMPDIR.relative("a"),
						TMPDIR.relative("b")
					];
					verify(isSameSet(actual, expected, matches), "isSameSet").is(true);
				}
			}
		//@ts-ignore
		)(fifty);


		export interface Directory {
			/**
			 * Removes the directory at the given location. If there is nothing at the given location, will fire the `notFound`
			 * event and return.
			 */
			remove: () => slime.$api.fp.world.old.Tell<{
				notFound: void
			}>

			exists: () => slime.$api.fp.world.old.Ask<void,boolean>
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
			exists: () => slime.$api.fp.world.old.Ask<{},boolean>

			write: {
				string: (p: {
					content: string
				}) => slime.$api.fp.world.old.Tell<{
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
					var read = function(at: Location): string {
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
					bytes: () => slime.$api.fp.world.old.Ask<{
						notFound: void
					},slime.jrunscript.runtime.io.InputStream>
				}

				/**
				 * Returns an `Ask` that returns the contents of the file as a string, or `null` if the file does not exist.
				 * The `Ask` also provides a `notFound` event to allow special handling of the case in which the file does not
				 * exist.
				 */
				string: () => slime.$api.fp.world.old.Ask<{
					notFound: void
				},string>
			}

			//	TODO	no tests
			/**
			 * @experimental May want to copy to another more general location, not just a path in the same filesystem
			 */
			copy: (p: {
				to: string
			}) => slime.$api.fp.world.old.Tell<void>
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
					const readString = function(p: slime.jrunscript.file.world.object.Location): string {
						return p.file.read.string()();
					}
					verify(here).relative("module.fifty.ts").evaluate(readString).is.type("string");
					verify(here).relative("foobar.fifty.ts").evaluate(readString).is.type("null");
				}
			}
		//@ts-ignore
		)(fifty);

		export namespace object {
			export interface Location {
				/**
				 * @deprecated Not world-oriented.
				 */
				file: File

				/**
				 * @deprecated Not world-oriented.
				 */
				directory: Directory
			}
		}

		export interface Filesystem {
			fileExists: slime.$api.fp.world.Question<{
				pathname: string
			},void,slime.$api.fp.Maybe<boolean>>

			openInputStream: slime.$api.fp.world.Question<{
				pathname: string
			},{
				notFound: void
			},slime.$api.fp.Maybe<slime.jrunscript.runtime.io.InputStream>>

			openOutputStream: slime.$api.fp.world.Question<{
				pathname: string
				append?: boolean
			},{
			},slime.$api.fp.Maybe<slime.jrunscript.runtime.io.OutputStream>>

			directoryExists: slime.$api.fp.world.Question<{
				pathname: string
			},void,slime.$api.fp.Maybe<boolean>>

			createDirectory: slime.$api.fp.world.Action<{
				pathname: string
				recursive: boolean
			},void>

			copy: slime.$api.fp.world.Action<{
				from: string
				to: string
			},void>

			/** @deprecated Not really world-oriented; use the methods of `Pathname`, `File`, and `Directory`. */
			pathname: (pathname: string) => object.Location

			/** @deprecated Use .pathname() to obtain a {@link Location}. */
			Pathname: {
				/** @deprecated Use .pathname() to obtain a {@link Location}. */
				relative: (parent: string, relative: string) => string

				/** @deprecated Use .pathname() to obtain a {@link Location}. */
				isDirectory: (pathname: string) => boolean
			}

			/** @deprecated Use .pathname() to obtain a {@link Location}. */
			File: {
				/** @deprecated Use .pathname() to obtain a {@link Location}. */
				read: {
					/** @deprecated Use .pathname() to obtain a {@link Location}. */
					stream: {
						/** @deprecated Use .pathname() to obtain a {@link Location}. */
						bytes: (pathname: string) => slime.$api.fp.world.old.Ask<{
							notFound: void
						},slime.jrunscript.runtime.io.InputStream>
					}

					/**
					 * Returns an `Ask` that returns the contents of the file as a string, or `null` if the file does not exist.
					 * The `Ask` also provides a `notFound` event to allow special handling of the case in which the file does not
					 * exist.
					 */
					string: slime.$api.fp.world.Question<
						{
							pathname: string
						},
						{
							notFound: void
						},
						string
					>
				}

				/** @deprecated Use .pathname() to obtain a {@link Location}. */
				copy: (p: {
					from: string
					to: string
				}) => slime.$api.fp.world.old.Tell<void>
			}

			/** @deprecated Use .pathname() to obtain a {@link Location}. */
			Directory: {
				/** @deprecated Use .pathname() to obtain a {@link Location}. */
				require: (p: {
					pathname: string
					recursive?: boolean
				}) => slime.$api.fp.world.old.Tell<void>

				/**
				 * @deprecated Use .pathname() to obtain a {@link Location}.
				 *
				 * Removes the directory at the given location. If there is nothing at the given location, will fire the `notFound`
				 * event and return.
				 */
				remove: (p: {
					pathname: string
				}) => slime.$api.fp.world.old.Tell<{
					notFound: void
				}>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				const { $api, jsh } = fifty.global;
				const { world } = jsh.file;
				const filesystem = world.filesystems.os;

				fifty.tests.sandbox.filesystem.Pathname = {
					relative: function() {

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
					var code = $api.Function.impure.now.input(
						$api.Function.world.ask(filesystem.File.read.string({ pathname: me }))
					);
					verify(code,"code").is.type("string");
					var no = $api.Function.impure.now.input(
						$api.Function.world.ask(filesystem.File.read.string({ pathname: nothing }))
					);
					verify(no,"no").is.type("null");

					fifty.run(function string() {
						var pathname = function(relative: string) { return fifty.jsh.file.object.getRelativePath(relative).toString(); };
						var thisFile = pathname("module.fifty.ts");
						var doesNotExist = pathname("foo");
						var thisFileContents = $api.Function.impure.now.input(
							$api.Function.world.ask(
								filesystem.File.read.string({ pathname: thisFile })
							)
						);
						var doesNotExistContents = $api.Function.impure.now.input(
							$api.Function.world.ask(
								filesystem.File.read.string({ pathname: doesNotExist })
							)
						);
						verify(thisFileContents).is.type("string");
						verify(doesNotExistContents).is.type("null");
					});
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

		providers: {
			os: slime.jrunscript.file.internal.java.FilesystemProvider
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.sandbox);
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
			const { $api, jsh } = fifty.global;
			const { world } = jsh.file;

			fifty.tests.world = function() {
				var pathname = fifty.jsh.file.object.getRelativePath("module.fifty.ts").toString();
				var contents = $api.Function.impure.now.input(
					$api.Function.world.ask(
						world.filesystems.os.File.read.string({ pathname: pathname })
					)
				);
				jsh.shell.console(contents.substring(0,500));

				var folder = fifty.jsh.file.object.getRelativePath(".").toString();
				var file = "module.fifty.ts";
				var relative = world.filesystems.os.Pathname.relative(folder, file);
				jsh.shell.console(relative);
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.file.internal.world {
	export interface Context {
		library: {
			io: slime.jrunscript.io.Exports
		}
		module: {
			java: slime.jrunscript.file.internal.java.Exports
		}
	}

	export type Script = slime.loader.Script<Context,slime.jrunscript.file.World>
}
