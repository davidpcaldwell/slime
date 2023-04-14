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
			const { run } = fifty;

			fifty.tests.sandbox = fifty.test.Parent();

			fifty.tests.sandbox.filesystem = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace world {
		export interface Location {
			readonly filesystem: spi.Filesystem
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

		export namespace location {
			export interface Exports {
				relative: (path: string) => (p: world.Location) => world.Location
				parent: () => (p: world.Location) => world.Location
			}

			export interface Exports {
				file: Files
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
				directory: Directory
			}

			export interface Directory {}
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

			export interface Files {
				/**
				 * Copies a file to a given location, creating the location's parent folders as necessary.
				 */
				copy: (p: {
					to: world.Location
				}) => slime.$api.fp.world.Action<
					world.Location,
					{
						/**
						 * Fired when a directory is created.
						 */
						created: string
					}
				>

				move: (p: {
					to: world.Location
				}) => slime.$api.fp.world.Action<
					world.Location,
					{
						/**
						 * Fired when a directory is created.
						 */
						 created: string
					}
				>
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;
					const { $api, jsh } = fifty.global;

					var writeText = function(location: slime.jrunscript.file.world.Location) {
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

			export interface Files {
				exists: () => slime.$api.fp.world.Question<world.Location, {}, boolean>

				read: {
					stream: () => slime.$api.fp.world.Question<world.Location, {
						notFound: void
					}, slime.$api.fp.Maybe<slime.jrunscript.runtime.io.InputStream>>

					string: () => slime.$api.fp.world.Question<world.Location, {
						notFound: void
					}, slime.$api.fp.Maybe<string>>
				}

				write: (location: world.Location) => {
					string: slime.$api.fp.world.Action<{ value: string },{}>
					stream: slime.$api.fp.world.Action<{ input: slime.jrunscript.runtime.io.InputStream },{}>
					object: {
						text: slime.$api.fp.world.Question<{},{},slime.$api.fp.Maybe<slime.jrunscript.runtime.io.Writer>>
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

							var writeA = function(location: slime.jrunscript.file.world.Location) {
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
			export interface Directory {
				exists: () => slime.$api.fp.world.Question<world.Location, {}, boolean>

				require: (p?: { recursive?: boolean }) => slime.$api.fp.world.Action<world.Location, {
					created: world.Location
					found: world.Location
				}>
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
			export interface Directory {
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
			export interface Directory {
				remove: () => slime.$api.fp.world.Action<world.Location,void>
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
			export interface Directory {
				loader: {
					synchronous: (p: {
						root: Location
					}) => slime.runtime.loader.Synchronous<slime.jrunscript.file.internal.loader.Resource>
				}
			}
		}

		export namespace location {
			export interface Exports {
				from: {
					os: (pathname: string) => Location

					temporary: (filesystem: spi.Filesystem) => slime.$api.fp.world.Question<
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

					fifty.tests.wip = fifty.tests.sandbox.filesystem.temporary;
				}
			//@ts-ignore
			)(fifty);
		}
	}

	export interface World {
		Location: world.location.Exports
	}

	export namespace world {
		export namespace spi {
			export interface Filesystem {
				separator: {
					pathname: string
					searchpath: string
				}
			}

			export interface Node {
				name: string
				type: "file" | "directory"
			}

			export interface Filesystem {
				fileExists: slime.$api.fp.world.Question<{
					pathname: string
				},void,slime.$api.fp.Maybe<boolean>>

				fileLength: slime.$api.fp.world.Question<{
					pathname: string
				},void,slime.$api.fp.Maybe<number>>

				/**
				 * Returns the time the file was last modified, in milliseconds since the UNIX epoch.
				 */
				fileLastModified: slime.$api.fp.world.Question<{
					pathname: string
				},void,slime.$api.fp.Maybe<number>>

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
				},{
				}>

				listDirectory: slime.$api.fp.world.Question<{
					pathname: string
				},{
				},slime.$api.fp.Maybe<Node[]>>

				copy: slime.$api.fp.world.Action<{
					from: string
					to: string
				},void>

				move: slime.$api.fp.world.Action<{
					from: string
					to: string
				},void>

				remove: slime.$api.fp.world.Action<{
					pathname: string
				},void>
			}

			export interface Filesystem {
				temporary: slime.$api.fp.world.Question<
					{
						parent?: string
						prefix?: string
						suffix?: string
						directory: boolean
					},
					void,
					string
				>
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					fifty.tests.spi = {};

					fifty.tests.spi.filesystem = {};
				}
			//@ts-ignore
			)(fifty);

			export interface Filesystem {
				openInputStream: slime.$api.fp.world.Question<{
					pathname: string
				},{
					notFound: void
				},slime.$api.fp.Maybe<slime.jrunscript.runtime.io.InputStream>>
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;
					const { $api, jsh } = fifty.global;
					const { world } = jsh.file;

					fifty.tests.spi.filesystem.openInputStreamNotFound = function(filesystem: Filesystem) {
						var notFound = $api.fp.world.now.question(
							filesystem.temporary,
							{
								directory: false
							}
						);
						$api.fp.world.now.tell(
							filesystem.remove({ pathname: notFound })
						);
						var exists = $api.fp.world.now.ask(filesystem.fileExists({ pathname: notFound }));
						verify(exists.present).is(true);
						if (exists.present) {
							verify(exists).value.is(false);
						}

						var notFoundEvent;
						var input = $api.fp.world.now.question(
							filesystem.openInputStream,
							{ pathname: notFound },
							{
								notFound: function(e) {
									notFoundEvent = e;
								}
							}
						);

						verify(notFoundEvent).is.type("object");
						jsh.shell.console(notFoundEvent.detail);
						jsh.shell.console(null);

						verify(input).present.is(false);
					}

					fifty.tests.sandbox.filesystem.openInputStreamNotFound = function() {
						fifty.load("world.fifty.ts", "spi.filesystem.openInputStreamNotFound", world.filesystems.os);
					}
				}
			//@ts-ignore
			)(fifty);

			export interface Filesystem {
				relative: (base: string, relative: string) => string
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;

					fifty.tests.spi.filesystem.relative = function(filesystem: Filesystem) {
						//	TODO	Not a very good test for Windows filesystem
						var prefix = "/";
						var base = prefix + "foo" + filesystem.separator.pathname + "bar";
						var relative = "baz";
						verify(filesystem).relative(base, relative).is(prefix + ["foo", "bar", "baz"].join(filesystem.separator.pathname));
					}
				}
			//@ts-ignore
			)(fifty);

			export interface Filesystem {
				/**
				 * @deprecated Not really world-oriented; use the methods of `Pathname`, `File`, and `Directory`. Cannot be removed
				 * without converting resulting usages of `object.Location` to usages of {@link Location}.
				 */
				pathname: (pathname: string) => object.Location

				/** @deprecated Use .pathname() to obtain a {@link Location}. */
				Pathname: {
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
		}
	}

	export interface World {
		filesystems: {
			os: world.spi.Filesystem
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.load("mock.fifty.ts");

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
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { world } = jsh.file;

			fifty.tests.world = function() {
				var pathname = fifty.jsh.file.object.getRelativePath("module.fifty.ts").toString();
				var contents = $api.fp.impure.now.input(
					$api.fp.world.input(
						world.filesystems.os.File.read.string({ pathname: pathname })
					)
				);
				jsh.shell.console(contents.substring(0,500));

				var folder = fifty.jsh.file.object.getRelativePath(".").toString();
				var file = "module.fifty.ts";
				var relative = world.filesystems.os.relative(folder, file);
				jsh.shell.console(relative);
				var relative2 = world.filesystems.os.relative(pathname, "foo");
				jsh.shell.console(relative2);

				fifty.load("world.fifty.ts", "spi.filesystem", world.filesystems.os);
			};

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.file.internal.world {
	export interface Context {
		library: {
			io: slime.jrunscript.io.Exports
		}
	}

	export interface Exports extends slime.jrunscript.file.World {
		providers: {
			os: slime.jrunscript.file.internal.java.FilesystemProvider
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}
