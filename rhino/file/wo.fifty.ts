//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.sandbox = fifty.test.Parent();

			fifty.tests.sandbox.filesystem = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Location {
		readonly filesystem: world.Filesystem
		readonly pathname: string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Location = fifty.test.Parent();
			fifty.tests.sandbox.locations = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace location {
		export interface Exports {
			relative: (path: string) => (p: Location) => Location
			parent: () => (p: Location) => Location
		}

		export interface Exports {
			file: file.Exports
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.sandbox.locations.directory = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			directory: directory.Exports
		}

		export namespace directory {
			export interface Exports {}
		}
	}

	export namespace location {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.sandbox.locations.file = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export namespace file {
			export interface Exports {
				/**
				 * Copies a file to a given location, creating the location's parent folders as necessary.
				 */
				copy: (p: {
					to: Location
				}) => slime.$api.fp.world.Action<
					Location,
					{
						/**
						 * Fired when a directory is created.
						 */
						created: string
					}
				>

				move: (p: {
					to: Location
				}) => slime.$api.fp.world.Action<
					Location,
					{
						/**
						 * Fired when a directory is created.
						 */
						created: string
					}
				>

				remove: () => slime.$api.fp.world.Action<Location,void>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				var writeText = function(location: slime.jrunscript.file.Location) {
					var write = jsh.file.world.Location.file.write(location);
					$api.fp.world.now.action(write.string, { value: "tocopy" });
				};

				var readText = $api.fp.pipe(
					$api.fp.world.mapping(
						jsh.file.world.Location.file.read.string()
					),
					$api.fp.Maybe.map(function(s) { return s; }),
					$api.fp.Maybe.else(function(): string { return null; })
				);

				var exists = $api.fp.world.mapping(
					jsh.file.world.Location.file.exists()
				);

				var dExists = $api.fp.world.mapping(
					jsh.file.world.Location.directory.exists()
				)

				fifty.tests.sandbox.locations.file.copy = function() {
					fifty.run(function basic() {
						var from = fifty.jsh.file.temporary.location();
						var to = fifty.jsh.file.temporary.location();

						verify(readText(from)).is(null);
						writeText(from);
						verify(readText(from)).is("tocopy");

						verify(exists(to)).is(false);
						verify(readText(to)).is(null);

						var copy = $api.fp.world.output(jsh.file.world.Location.file.copy({ to: to }));
						copy(from);

						verify(exists(to)).is(true);
						verify(readText(to)).is("tocopy");
					});

					fifty.run(function recursive() {
						var from = fifty.jsh.file.temporary.location();
						var parent = fifty.jsh.file.temporary.location();
						var to = $api.fp.result(
							parent,
							jsh.file.world.Location.relative("foo")
						);

						verify(readText(from)).is(null);
						writeText(from);
						verify(readText(from)).is("tocopy");

						var captor = fifty.$api.Events.Captor({
							created: void(0)
						});
						verify(captor).events.length.is(0);

						verify(dExists(parent)).is(false);
						verify(exists(to)).is(false);
						verify(readText(to)).is(null);

						var copy = $api.fp.world.output(jsh.file.world.Location.file.copy({ to: to }), captor.handler);
						copy(from);

						verify(dExists(parent)).is(true);
						verify(exists(to)).is(true);
						verify(readText(to)).is("tocopy");
						verify(captor).events.length.is(1);
					});
				};

				fifty.tests.sandbox.locations.file.move = function() {
					fifty.run(function basic() {
						var from = fifty.jsh.file.temporary.location();
						var to = fifty.jsh.file.temporary.location();

						verify(readText(from)).is(null);
						writeText(from);
						verify(readText(from)).is("tocopy");

						verify(exists(from)).is(true);
						verify(exists(to)).is(false);
						verify(readText(to)).is(null);

						var copy = $api.fp.world.output(jsh.file.world.Location.file.move({ to: to }));
						copy(from);

						verify(exists(from)).is(false);
						verify(exists(to)).is(true);
						verify(readText(to)).is("tocopy");
					});

					fifty.run(function recursive() {
						var from = fifty.jsh.file.temporary.location();
						var parent = fifty.jsh.file.temporary.location();
						var to = $api.fp.result(
							parent,
							jsh.file.world.Location.relative("foo")
						);

						verify(readText(from)).is(null);
						writeText(from);
						verify(readText(from)).is("tocopy");

						var captor = fifty.$api.Events.Captor({
							created: void(0)
						});
						verify(captor).events.length.is(0);

						verify(exists(from)).is(true);
						verify(dExists(parent)).is(false);
						verify(exists(to)).is(false);
						verify(readText(to)).is(null);

						var copy = $api.fp.world.output(jsh.file.world.Location.file.move({ to: to }), captor.handler);
						copy(from);

						verify(exists(from)).is(false);
						verify(dExists(parent)).is(true);
						verify(exists(to)).is(true);
						verify(readText(to)).is("tocopy");
						verify(captor).events.length.is(1);
					});
				}
			}
		//@ts-ignore
		)(fifty);

		export namespace file {
			export interface Exports {
				exists: () => slime.$api.fp.world.Question<Location, {}, boolean>

				read: {
					stream: () => slime.$api.fp.world.Question<Location, {
						notFound: void
					}, slime.$api.fp.Maybe<slime.jrunscript.runtime.io.InputStream>>

					string: () => slime.$api.fp.world.Question<Location, {
						notFound: void
					}, slime.$api.fp.Maybe<string>>
				}

				write: (location: Location) => {
					string: slime.$api.fp.world.Action<{ value: string },{}>
					stream: slime.$api.fp.world.Action<{ input: slime.jrunscript.runtime.io.InputStream },{}>
					object: {
						text: slime.$api.fp.world.Question<{},{},slime.$api.fp.Maybe<slime.jrunscript.runtime.io.Writer>>
					}
				}
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const subject = jsh.file.world;

				fifty.tests.sandbox.locations.file.other = function() {
					fifty.run(function exists() {
						var at = fifty.jsh.file.temporary.location();

						var exists = $api.fp.world.mapping(subject.Location.file.exists());

						verify(exists(at)).is(false);

						var writeA = function(location: slime.jrunscript.file.Location) {
							var write = jsh.file.world.Location.file.write(location);
							$api.fp.world.now.action(write.string, { value: "a" });
						}

						$api.fp.impure.now.output(at, writeA);

						verify(exists(at)).is(true);
					});

					fifty.run(function binary() {
						var at = fifty.jsh.file.temporary.location();

						var buffer = new jsh.io.Buffer();
						buffer.writeText().write("text");
						buffer.close();

						var process = function() {
							var write = subject.Location.file.write(at);
							$api.fp.world.now.action(write.stream, { input: buffer.readBinary() });
						};

						process();

						var getText = $api.fp.world.input(
							subject.Location.file.read.string()(at)
						);

						var maybeText = getText();

						if (maybeText.present) {
							verify(maybeText.value).is("text");
						} else {
							verify(maybeText).present.is(true);
						}
					});
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace location {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Location.directory = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export namespace directory {
			export interface Exports {
				exists: () => slime.$api.fp.world.Question<world.Location, {}, boolean>

				require: (p?: { recursive?: boolean }) => slime.$api.fp.world.Action<world.Location, {
					created: world.Location
					found: world.Location
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

				fifty.tests.sandbox.locations.directory.exists = function() {
					var at = fifty.jsh.file.temporary.location();

					var exists = Object.assign($api.fp.world.mapping(subject.Location.directory.exists()), { toString: function() { return "exists()"; }});

					verify(at).evaluate(exists).is(false);

					$api.fp.world.process(subject.Location.directory.require()(at))();
					verify(at).evaluate(exists).is(true);

					$api.fp.world.process(subject.Location.directory.require()(at))();
					verify(at).evaluate(exists).is(true);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace location {
		export namespace directory {
			export interface Exports {
				//	TODO	what if something exists at to()?
				/**
				 * Moves a directory.
				 */
				move: (p: {
					to: world.Location
				}) => slime.$api.fp.world.Action<
					world.Location,
					{ created: string }
				>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				fifty.tests.sandbox.locations.directory.move = function() {
					const exists = {
						file: $api.fp.world.mapping(jsh.file.world.Location.file.exists()),
						directory: $api.fp.world.mapping(jsh.file.world.Location.directory.exists())
					};

					const atFilepath = jsh.file.world.Location.relative("filepath");

					const createDirectoryToMove = $api.fp.impure.Input.map(
						fifty.jsh.file.temporary.location,
						$api.fp.pipe(
							//	TODO	Output.compose?
							$api.fp.impure.tap(
								$api.fp.world.output(jsh.file.world.Location.directory.require())
							),
							$api.fp.impure.tap(
								$api.fp.pipe(
									atFilepath,
									function(location: slime.jrunscript.file.world.Location) {
										var write = jsh.file.world.Location.file.write(location);
										$api.fp.world.now.action(write.string, { value: "contents" })
									}
								)
							)
						)
					)

					fifty.run(function basic() {
						var from = createDirectoryToMove();

						var to = fifty.jsh.file.temporary.location();

						(function before() {
							verify(from).evaluate(exists.directory).is(true);
							verify(from).evaluate(atFilepath).evaluate(exists.file).is(true);
							verify(to).evaluate(exists.directory).is(false);
							verify(to).evaluate(atFilepath).evaluate(exists.file).is(false);
						})();

						var move = $api.fp.world.output(
							jsh.file.world.Location.directory.move({ to: to })
						);

						move(from);

						(function after() {
							verify(from).evaluate(exists.directory).is(false);
							verify(from).evaluate(atFilepath).evaluate(exists.file).is(false);
							verify(to).evaluate(exists.directory).is(true);
							verify(to).evaluate(atFilepath).evaluate(exists.file).is(true);
						})();
					});

					fifty.run(function recursive() {
						var from = createDirectoryToMove();

						var parent = fifty.jsh.file.temporary.location();

						var to = $api.fp.result(parent, jsh.file.world.Location.relative("child"));

						var captor = fifty.$api.Events.Captor({
							created: void(0)
						});

						(function before() {
							verify(from).evaluate(exists.directory).is(true);
							verify(from).evaluate(atFilepath).evaluate(exists.file).is(true);
							verify(to).evaluate(exists.directory).is(false);
							verify(to).evaluate(atFilepath).evaluate(exists.file).is(false);
							verify(captor).events.length.is(0);
						})();

						var move = $api.fp.world.output(
							jsh.file.world.Location.directory.move({ to: to }),
							captor.handler
						);

						move(from);

						(function after() {
							verify(from).evaluate(exists.directory).is(false);
							verify(from).evaluate(atFilepath).evaluate(exists.file).is(false);
							verify(to).evaluate(exists.directory).is(true);
							verify(to).evaluate(atFilepath).evaluate(exists.file).is(true);
							verify(captor).events.length.is(1);
						})();
					});
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace location {
		export namespace directory {
			export interface Exports {
				remove: () => slime.$api.fp.world.Action<world.Location,void>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				const exists = {
					directory: $api.fp.world.mapping(jsh.file.world.Location.directory.exists())
				};

				fifty.tests.sandbox.locations.directory.remove = function() {
					var tmp = fifty.jsh.file.temporary.directory();

					verify(tmp).evaluate(exists.directory).is(true);

					$api.fp.world.now.action(jsh.file.world.Location.directory.remove(), tmp);

					verify(tmp).evaluate(exists.directory).is(false);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace location {
		export namespace directory {
			export namespace list {
				export interface Events {
					failed: Location
				}
			}
			export interface Exports {
				list: {
					stream: (p?: {
						descend: slime.$api.fp.Predicate<Location>
					}) => slime.$api.fp.world.Question<
						slime.jrunscript.file.world.Location,
						list.Events,
						slime.$api.fp.Stream<Location>
					>
				}
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;
					const { $api } = fifty.global;
					const subject = fifty.global.jsh.file.world;

					fifty.tests.exports.Location.directory.list = function() {
						debugger;
						var fs = internal.test.fixtures.Filesystem.from.descriptor({
							contents: {
								a: {
									text: ""
								},
								b: {
									text: ""
								},
								c: {
									text: ""
								}//,
								// d: {
								// 	contents: {
								// 		dd: {
								// 			text: ""
								// 		}
								// 	}
								// }
							}
						});

						var simple = $api.fp.Stream.collect($api.fp.world.now.question(
							subject.Location.directory.list.stream(),
							{
								filesystem: fs,
								pathname: ""
							}
						));

						verify(simple).length.is(3);
						verify(simple)[0].pathname.is("/a");
						verify(simple)[1].pathname.is("/b");
						verify(simple)[2].pathname.is("/c");
						//verify(simple)[3].pathname.is("/d");
					};

					fifty.tests.wip = fifty.tests.exports.Location.directory.list;
				}
			//@ts-ignore
			)(fifty);
		}
	}

	export namespace location {
		export namespace directory {
			export interface Exports {
				loader: {
					synchronous: (p: {
						root: Location
					}) => slime.runtime.loader.Synchronous<slime.jrunscript.file.internal.loader.Resource>
				}
			}
		}
	}

	export namespace location {
		export interface Exports {
			from: {
				os: (pathname: string) => Location

				temporary: (filesystem: world.Filesystem) => slime.$api.fp.world.Question<
					{
						parent?: string
						prefix?: string
						suffix?: string
						directory: boolean
					},
					void,
					Location
				>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const { Location } = jsh.file.world;

				fifty.tests.sandbox.filesystem.temporary = function() {
					//	Really the only defined attribute of a "temporary" file is that after this method is called, it should
					//	exist. So going to test for that, and test for files and directories.

					var exists = {
						file: $api.fp.world.mapping(Location.file.exists()),
						directory: $api.fp.world.mapping(Location.directory.exists())
					};

					var os = jsh.file.world.filesystems.os;

					var tmpfile = $api.fp.world.input(jsh.file.world.Location.from.temporary(os)({ directory: false }));
					var tmpdir = $api.fp.world.input(jsh.file.world.Location.from.temporary(os)({ directory: true }));

					var file = $api.fp.impure.Input.process(
						tmpfile,
						function(location) {
							verify(location).evaluate(exists.file).is(true);
						}
					);

					var directory = $api.fp.impure.Input.process(
						tmpdir,
						function(location) {
							verify(location).evaluate(exists.directory).is(true);
						}
					);

					$api.fp.impure.now.process(
						$api.fp.impure.Process.compose([
							file,
							directory
						])
					);
				};
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { jsh } = fifty.global;
				const { world } = jsh.file;

				fifty.tests.sandbox.filesystem.openInputStreamNotFound = function() {
					fifty.load("world.fifty.ts", "spi.filesystem.openInputStreamNotFound", world.filesystems.os);
				}
			}
		//@ts-ignore
		)(fifty);


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
							thisFile: filesystem.relative(parent, "module.fifty.ts"),
							nothing: filesystem.relative(parent, "foo"),
							subfolder: filesystem.relative(parent, "java")
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
					var me = filesystem.relative(here, "module.fifty.ts");
					var nothing = filesystem.relative(here, "nonono");
					var code = $api.fp.impure.now.input(
						$api.fp.world.input(filesystem.File.read.string({ pathname: me }))
					);
					verify(code,"code").is.type("string");
					var no = $api.fp.impure.now.input(
						$api.fp.world.input(filesystem.File.read.string({ pathname: nothing }))
					);
					verify(no,"no").is.type("null");

					fifty.run(function string() {
						var pathname = function(relative: string) { return fifty.jsh.file.object.getRelativePath(relative).toString(); };
						var thisFile = pathname("module.fifty.ts");
						var doesNotExist = pathname("foo");
						var thisFileContents = $api.fp.impure.now.input(
							$api.fp.world.input(
								filesystem.File.read.string({ pathname: thisFile })
							)
						);
						var doesNotExistContents = $api.fp.impure.now.input(
							$api.fp.world.input(
								filesystem.File.read.string({ pathname: doesNotExist })
							)
						);
						verify(thisFileContents).is.type("string");
						verify(doesNotExistContents).is.type("null");
					});
				}

				fifty.tests.sandbox.filesystem.Directory = {};

				fifty.tests.sandbox.filesystem.Directory.remove = function() {
					var TMPDIR = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var location = filesystem.relative(TMPDIR.toString(), "toRemove");
					var exists = function(location) {
						return filesystem.Pathname.isDirectory(location);
					}
					verify(location).evaluate(exists).is(false);
					$api.fp.world.now.action(filesystem.createDirectory, { pathname: location });
					verify(location).evaluate(exists).is(true);
					filesystem.Directory.remove({
						pathname: location
					})();
					verify(location).evaluate(exists).is(false);

					var doesNotExist = filesystem.relative(TMPDIR.toString(), "notThere");
					verify(doesNotExist).evaluate(exists).is(false);
					filesystem.Directory.remove({
						pathname: doesNotExist
					})();
					verify(doesNotExist).evaluate(exists).is(false);
				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.suite = function() {
					fifty.run(fifty.tests.exports);
					fifty.run(fifty.tests.sandbox);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace internal.test {
		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			const code: slime.jrunscript.file.test.fixtures.Script = fifty.$loader.script("fixtures.ts");
			return code({
				fifty: fifty
			});
		//@ts-ignore
		})(fifty);
	}
}
