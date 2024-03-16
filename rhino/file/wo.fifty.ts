//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Location {
		readonly filesystem: world.Filesystem
		readonly pathname: string
	}

	export interface Exports {
		Location: location.Exports

		Filesystem: filesystem.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.exports.Location = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.sandbox = fifty.test.Parent();

			fifty.tests.sandbox.filesystem = fifty.test.Parent();
			fifty.tests.sandbox.filesystem.file = fifty.test.Parent();
			fifty.tests.sandbox.filesystem.directory = fifty.test.Parent();

			fifty.tests.sandbox.locations = fifty.test.Parent();
			fifty.tests.sandbox.locations.file = fifty.test.Parent();
			fifty.tests.sandbox.locations.directory = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace posix {
		export interface Attributes {
			owner: string
			group: string
			permissions: Permissions
		}

		export interface Permissions {
			owner: {
				read: boolean
				write: boolean
				execute: boolean
			}

			group: {
				read: boolean
				write: boolean
				execute: boolean
			}

			others: {
				read: boolean
				write: boolean
				execute: boolean
			}
		}
	}

	export namespace location {
		export interface Exports {
			parent: () => (p: Location) => Location
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const subject = fifty.global.jsh.file;

				fifty.tests.exports.Location.parent = function() {
					var pathname = "/a/b/c";
					var child = subject.Location.from.os(pathname);
					var parent = subject.Location.parent()(child);
					verify(parent).pathname.is("/a/b");
				};
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			basename: (p: Location) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const subject = fifty.global.jsh.file;

				fifty.tests.exports.Location.basename = function() {
					var pathname = "/a/b/c";
					var location = subject.Location.from.os(pathname);
					var basename = subject.Location.basename(location);
					verify(basename).is("c");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			canonicalize: (p: Location) => Location
		}

		export interface Exports {
			/** @deprecated Replaced by `directory.relativePath`. */
			relative: (path: string) => (p: Location) => Location
		}

		export interface Exports {
			posix: {
				attributes: {
					/**
					 * Returns the POSIX attributes for a given `Location`, if the `Location`'s file system supports POSIX
					 * attributes.
					 */
					get: slime.$api.fp.world.Sensor<{
						location: Location
					}, void, slime.$api.fp.Maybe<posix.Attributes>>

					//	TODO	support owner/group updates below and update comments in following two methods.

					/**
					 * Sets the POSIX attributes for the given `Location` to the given value. If the `Location`'s file system does
					 * not support POSIX attributes, does nothing.
					 *
					 * Note that only superusers can update the owner or group for files; attempting to update these values as a
					 * normal user will result in an exception.
					 */
					set: slime.$api.fp.world.Means<{
						location: Location
						attributes: posix.Attributes
					}, void>

					/**
					 * Updates the POSIX attributes for the given `Location` with the given transformation. If the `Location`'s
					 * file system does not support POSIX attributes, does nothing.
					 *
					 * Note that only superusers can update the owner or group for files; attempting to update these values as a
					 * normal user will result in an exception.
					 */
					update: slime.$api.fp.world.Means<{
						location: Location
						attributes: slime.$api.fp.Transform<posix.Attributes>
					}, void>

					Update: {
						permissions: {
							set: {
								executable: {
									all: (value: boolean) => slime.$api.fp.Transform<posix.Attributes>
								}
							}
						}
					}
				}
			}
		}

		(
			function(
				Packages: slime.jrunscript.Packages,
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				fifty.tests.exports.Location.posix = function() {
					var tmp = fifty.jsh.file.temporary.location();
					$api.fp.world.now.action(
						jsh.file.Location.file.write(tmp).string,
						{ value: "" }
					);

					if (!tmp.filesystem.posix) return;

					var _lookup;
					try {
						_lookup = Packages.java.nio.file.FileSystems.getDefault().getUserPrincipalLookupService();
					} catch (e) {
						throw e;
					}

					var ROOT = jsh.shell.USER == "root";

					var getUser = function(name) {
						try {
							return _lookup.lookupPrincipalByName(name);
						} catch (e) {
							return null;
						}
					};

					var getGroup = function(name) {
						try {
							return _lookup.lookupPrincipalByGroupName(name);
						} catch (e) {
							return null;
						}
					}

					var getAttributes = function(tmp: Location) {
						var rv = $api.fp.world.now.ask(jsh.file.Location.posix.attributes.get({
							location: tmp
						}));
						if (!rv.present) throw new Error();
						return rv.value;
					};

					var initial = getAttributes(tmp);

					//	Only superuser can update user / group for files, roughly (actually owner can "update" owner to itself and
					//	update group to a group to which it belongs, allegedly)
					var otherUser = (ROOT && getUser("nobody")) ? "nobody" : initial.owner;
					var otherGroup = (ROOT && getGroup("wheel")) ? "wheel" : initial.group;

					$api.fp.world.now.tell(
						jsh.file.Location.posix.attributes.set({
							location: tmp,
							attributes: {
								owner: otherUser,
								group: otherGroup,
								permissions: {
									owner: { read: true, write: true, execute: false },
									group: { read: true, write: false, execute: false },
									others: { read: false, write: false, execute: false }
								}
							}
						})
					);

					var set = getAttributes(tmp);
					verify(set).owner.is(otherUser);
					verify(set).group.is(otherGroup);
					verify(set).permissions.owner.read.is(true);
					verify(set).permissions.owner.write.is(true);
					verify(set).permissions.owner.execute.is(false);
					verify(set).permissions.group.read.is(true);
					verify(set).permissions.group.write.is(false);
					verify(set).permissions.group.execute.is(false);
					verify(set).permissions.others.read.is(false);
					verify(set).permissions.others.write.is(false);
					verify(set).permissions.others.execute.is(false);

					$api.fp.world.now.tell(
						jsh.file.Location.posix.attributes.update({
							location: tmp,
							attributes: function(attributes) {
								return {
									owner: set.owner,
									group: set.group,
									permissions: {
										owner: {
											read: set.permissions.owner.read,
											write: set.permissions.owner.write,
											execute: true
										},
										group: {
											read: set.permissions.group.read,
											write: set.permissions.group.write,
											execute: true
										},
										others: {
											read: set.permissions.others.read,
											write: set.permissions.others.write,
											execute: true
										}
									}
								};
							}
						})
					);

					var updated = getAttributes(tmp);
					verify(updated).owner.is(set.owner);
					verify(updated).group.is(set.group);
					verify(updated).permissions.owner.read.is(true);
					verify(updated).permissions.owner.write.is(true);
					verify(updated).permissions.owner.execute.is(true);
					verify(updated).permissions.group.read.is(true);
					verify(updated).permissions.group.write.is(false);
					verify(updated).permissions.group.execute.is(true);
					verify(updated).permissions.others.read.is(false);
					verify(updated).permissions.others.write.is(false);
					verify(updated).permissions.others.execute.is(true);
				}
			}
		//@ts-ignore
		)(Packages,fifty);
	}

	export namespace location {
		export interface Exports {
			file: file.Exports
		}
	}

	export namespace location {
		export namespace file {
			export interface Exports {
				size: slime.$api.fp.world.Sensor<Location, void, number>
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { jsh } = fifty.global;

					fifty.tests.sandbox.locations.file.size = function() {
						//	TODO	write a test
					}

					fifty.tests.sandbox.locations.file.length = function() {
						//	shadowed; see issue #1188
						jsh.shell.console("#1188");
					}
				}
			//@ts-ignore
			)(fifty);
		}
	}

	export namespace location {
		export namespace file {
			export interface Exports {
				remove: {
					simple: slime.$api.fp.impure.Output<Location>
					world: () => slime.$api.fp.world.Means<Location,void>
				}
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
						jsh.file.world.Location.file.read.string.world()
					),
					$api.fp.Maybe.map(function(s) { return s; }),
					$api.fp.Maybe.else(function(): string { return null; })
				);

				var exists = $api.fp.world.mapping(
					jsh.file.world.Location.file.exists.world()
				);

				var dExists = $api.fp.world.mapping(
					jsh.file.world.Location.directory.exists.world()
				)

				fifty.tests.sandbox.filesystem.file.copy = function() {
					fifty.run(function basic() {
						var from = fifty.jsh.file.temporary.location();
						var to = fifty.jsh.file.temporary.location();

						verify(readText(from)).is(null);
						writeText(from);
						verify(readText(from)).is("tocopy");

						verify(exists(to)).is(false);
						verify(readText(to)).is(null);

						$api.fp.world.now.action(
							jsh.file.Filesystem.copy,
							{
								filesystem: jsh.file.world.filesystems.os,
								from: from.pathname,
								to: to.pathname
							}
						);

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

						$api.fp.world.now.action(
							jsh.file.Filesystem.copy,
							{
								filesystem: jsh.file.world.filesystems.os,
								from: from.pathname,
								to: to.pathname
							},
							captor.handler
						)

						verify(dExists(parent)).is(true);
						verify(exists(to)).is(true);
						verify(readText(to)).is("tocopy");
						verify(captor).events.length.is(1);
					});
				};

				fifty.tests.sandbox.filesystem.file.move = function() {
					fifty.run(function basic() {
						var from = fifty.jsh.file.temporary.location();
						var to = fifty.jsh.file.temporary.location();

						verify(readText(from)).is(null);
						writeText(from);
						verify(readText(from)).is("tocopy");

						verify(exists(from)).is(true);
						verify(exists(to)).is(false);
						verify(readText(to)).is(null);

						$api.fp.world.now.action(
							jsh.file.Filesystem.move,
							{
								filesystem: jsh.file.world.filesystems.os,
								from: from.pathname,
								to: to.pathname
							}
						);

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

						$api.fp.world.now.action(
							jsh.file.Filesystem.move,
							{
								filesystem: jsh.file.world.filesystems.os,
								from: from.pathname,
								to: to.pathname
							},
							captor.handler
						);

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
				exists: {
					simple: slime.$api.fp.Mapping<Location,boolean>
					world: () => slime.$api.fp.world.Sensor<Location, {}, boolean>
				}

				read: {
					stream: () => slime.$api.fp.world.Sensor<Location, {
						notFound: void
					}, slime.$api.fp.Maybe<slime.jrunscript.runtime.io.InputStream>>

					string: {
						world: () => slime.$api.fp.world.Sensor<Location, {
							notFound: void
						}, slime.$api.fp.Maybe<string>>

						maybe: slime.$api.fp.Mapping<Location, slime.$api.fp.Maybe<string>>

						simple: slime.$api.fp.Mapping<Location, string>
					}

					properties: {
						simple: slime.$api.fp.Mapping<Location, slime.jrunscript.host.Properties>
					}
				}

				write: (location: Location) => {
					string: slime.$api.fp.world.Means<{ value: string }, slime.jrunscript.file.world.events.FileOpenForWrite>
					stream: slime.$api.fp.world.Means<{ input: slime.jrunscript.runtime.io.InputStream },slime.jrunscript.file.world.events.FileOpenForWrite>
					object: {
						text: slime.$api.fp.world.Sensor<
							{},
							slime.jrunscript.file.world.events.FileOpenForWrite,
							slime.$api.fp.Maybe<slime.jrunscript.runtime.io.Writer>
						>
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
				const subject = jsh.file;

				fifty.tests.sandbox.locations.file.other = function() {
					fifty.run(function exists() {
						var at = fifty.jsh.file.temporary.location();

						var exists = $api.fp.world.mapping(subject.Location.file.exists.world());

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
							subject.Location.file.read.string.world()(at)
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
		export interface Exports {
			directory: directory.Exports
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Location.directory = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export namespace directory {
			export interface Exports {}
		}

		export namespace directory {
			export interface Exports {
				base: (base: Location) => (relative: string) => Location
				relativePath: (path: string) => (p: Location) => Location
				relativeTo: (location: Location) => (p: Location) => string
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;

					const subject = fifty.global.jsh.file;

					const filesystem = subject.world.filesystems.mock();

					const at = (path: string): slime.jrunscript.file.Location => {
						return {
							filesystem: filesystem,
							pathname: path
						}
					}

					//	TODO	these tests might not pass on Windows

					fifty.tests.exports.Location.directory.relativePath = function() {
						var d = subject.Location.directory.relativePath("d");
						var target = d(at("/a/b/c"));
						verify(target).pathname.is("/a/b/c/d");
					};

					fifty.tests.exports.Location.directory.base = function() {
						var directory = subject.Location.directory.base(at("/a/b/c"));

						var one = directory("d");
						verify(one).pathname.is("/a/b/c/d");
						var two = directory("./d");
						verify(two).pathname.is("/a/b/c/d");
						var three = directory("../d");
						verify(three).pathname.is("/a/b/d");
					};

					fifty.tests.exports.Location.directory.relativeTo = function() {
						var target = at("/a/b/c");
						var relativeOf = subject.Location.directory.relativeTo(target);
						var one = relativeOf(at("/a/b/d"));
						verify(one).is("../d");
						var oneA = relativeOf(at("/a/c"));
						verify(oneA).is("../../c");
						var two = relativeOf(at("/b"));
						verify(two).is("../../../b");
						var three = relativeOf(at("/a/b/c/d"));
						verify(three).is("d");
						var four = relativeOf(at("/a/b/c"));
						verify(four).is("");
					};

					fifty.tests.exports.Location.directory.harvested = function() {
						//	TODO	Not a very good test for Windows filesystem
						var prefix = "/";
						var base = prefix + "foo" + filesystem.separator.pathname + "bar";
						var relative = "baz";
						var b: Location = {
							filesystem: filesystem,
							pathname: base
						};
						var bb = subject.Location.directory.base(b);
						verify(bb(relative)).pathname.is(prefix + ["foo", "bar", "baz"].join(filesystem.separator.pathname));
					}
				}
			//@ts-ignore
			)(fifty);

			export interface Exports {
				exists: {
					simple: slime.$api.fp.Mapping<Location,boolean>
					world: () => slime.$api.fp.world.Sensor<Location, {}, boolean>
				}

				require: (p?: { recursive?: boolean }) => slime.$api.fp.world.Means<world.Location, {
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

					var exists = Object.assign($api.fp.world.mapping(subject.Location.directory.exists.world()), { toString: function() { return "exists()"; }});

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
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				fifty.tests.sandbox.filesystem.directory.move = function() {
					const exists = {
						file: $api.fp.world.mapping(jsh.file.world.Location.file.exists.world()),
						directory: $api.fp.world.mapping(jsh.file.world.Location.directory.exists.world())
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

						$api.fp.world.now.action(
							jsh.file.Filesystem.move,
							{
								filesystem: jsh.file.world.filesystems.os,
								from: from.pathname,
								to: to.pathname
							}
						);

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

						$api.fp.world.now.action(
							jsh.file.Filesystem.move,
							{
								filesystem: jsh.file.world.filesystems.os,
								from: from.pathname,
								to: to.pathname
							},
							captor.handler
						);

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
				remove: {
					simple: slime.$api.fp.impure.Output<Location>
					world: () => slime.$api.fp.world.Means<Location,void>
				}
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				const exists = {
					directory: $api.fp.world.mapping(jsh.file.world.Location.directory.exists.world())
				};

				fifty.tests.sandbox.locations.directory.remove = function() {
					var tmp = fifty.jsh.file.temporary.directory();

					verify(tmp).evaluate(exists.directory).is(true);

					$api.fp.world.now.action(jsh.file.world.Location.directory.remove.world(), tmp);

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
						/**
						 * If provided, is invoked to decide whether the listing will descend into the given directory. By default,
						 * no subdirectories will be traversed.
						 */
						descend: slime.$api.fp.Predicate<Location>
					}) => slime.$api.fp.world.Sensor<
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
					const { $api, jsh } = fifty.global;
					const subject = fifty.global.jsh.file;

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

					fifty.tests.manual.issue1181 = function() {
						var location = fifty.jsh.file.temporary.location();
						var listing = $api.fp.world.now.question(
							subject.Location.directory.list.stream(),
							location,
							{
								failed: function(e) {
									jsh.shell.console("Failed: " + e.detail.pathname);
								}
							}
						);
						var array = $api.fp.Stream.collect(listing);
						jsh.shell.console(array.join(" "));
					}
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
					}) => slime.runtime.loader.Synchronous<slime.jrunscript.runtime.Resource>
				}
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;
					const { $api, jsh } = fifty.global;

					fifty.tests.sandbox.filesystem.directory.loader = fifty.test.Parent();
					fifty.tests.sandbox.filesystem.directory.loader.synchronous = function() {
						var dir = fifty.jsh.file.temporary.directory();
						var loader = jsh.file.Location.directory.loader.synchronous({ root: dir });

						var resource = loader.get(["a"]);
						verify(resource).present.is(false);

						$api.fp.now.invoke(
							dir,
							jsh.file.Location.directory.relativePath("a"),
							jsh.file.Location.file.write,
							$api.fp.property("string"),
							function(means) {
								$api.fp.world.now.action(
									means,
									{
										value: "foo"
									}
								)
							}
						);

						var resource = loader.get(["a"]);
						verify(resource).present.is(true);
						if (resource.present) {
							var value = resource.value;
							var stream = value.read();
							var string = $api.fp.world.now.ask(jsh.io.InputStream.string(stream));
							verify(string).is("foo");
						}

					}
				}
			//@ts-ignore
			)(fifty);
		}
	}

	export namespace location {
		export interface Exports {
			remove: {
				simple: slime.$api.fp.impure.Output<slime.jrunscript.file.Location>
			}
		}
	}

	export namespace location {
		export interface Exports {
			from: {
				os: (pathname: string) => Location

				temporary: (filesystem: world.Filesystem) => slime.$api.fp.world.Sensor<
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
				const { Location } = jsh.file;

				fifty.tests.sandbox.filesystem.temporary = function() {
					//	Really the only defined attribute of a "temporary" file is that after this method is called, it should
					//	exist. So going to test for that, and test for files and directories.

					var exists = {
						file: $api.fp.world.mapping(Location.file.exists.world()),
						directory: $api.fp.world.mapping(Location.directory.exists.world())
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

				fifty.tests.sandbox.filesystem.world = function() {
					fifty.load("world.fifty.ts", "spi.filesystem", world.filesystems.os);
				};

				fifty.tests.wip = function() {
					fifty.load("world.fifty.ts", "spi.filesystem.wip", world.filesystems.os);
				};
			}
		//@ts-ignore
		)(fifty);


		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				const { $api, jsh } = fifty.global;
				const subject = jsh.file;
				const { world } = jsh.file;
				const filesystem = world.filesystems.os;

				const filesystem_relative = function(filesystem: world.Filesystem) {
					return function(base: string, relative: string): string {
						var b: Location = {
							filesystem: filesystem,
							pathname: base
						};
						return subject.Location.directory.base(b)(relative).pathname;
					}
				}

				var f = filesystem_relative(filesystem);

				fifty.tests.sandbox.filesystem.Pathname = {
					isDirectory: function() {
						var parent = fifty.jsh.file.object.getRelativePath(".").toString();

						var cases = {
							parent: parent,
							thisFile: f(parent, "module.fifty.ts"),
							nothing: f(parent, "foo"),
							subfolder: f(parent, "java")
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
					var me = f(here, "module.fifty.ts");
					var nothing = f(here, "nonono");
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
					var location = f(TMPDIR.toString(), "toRemove");
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

					var doesNotExist = f(TMPDIR.toString(), "notThere");
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

	export namespace filesystem {
		export interface Exports {
			/**
			 * Copies a filesystem node to a given location, creating the location's parent folders as necessary.
			 */
			copy: slime.$api.fp.world.Means<
				{
					filesystem: world.Filesystem
					from: string
					to: string
				},
				{
					/**
					 * Fired when a directory is created.
					 */
					created: string
				}
			>

			/**
			 * Moves a filesystem node to a given location, creating the location's parent folders as necessary.
			 */
			move: slime.$api.fp.world.Means<
				{
					filesystem: world.Filesystem
					from: string
					to: string
				},
				{
					/**
					 * Fired when a directory is created.
					 */
					created: string
				}
			>
		}
	}

	export namespace internal.test {
		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			const code: slime.jrunscript.file.internal.test.fixtures.Script = fifty.$loader.script("fixtures.ts");
			return code({
				fifty: fifty
			});
		//@ts-ignore
		})(fifty);
	}
}

namespace slime.jrunscript.file.internal.wo {
	export interface Context {
		library: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}
		filesystem: {
			os: slime.jrunscript.file.world.Filesystem
		}
	}

	export interface Exports {
		Location: location.Exports
		Filesystem: slime.jrunscript.file.filesystem.Exports
	}

	export type Script = slime.loader.Script<Context,Exports>
}
