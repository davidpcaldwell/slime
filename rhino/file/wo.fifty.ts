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
		Location: exports.Location

		Filesystem: exports.Filesystem

		os: exports.os
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

	export namespace exports {
		export interface Location {
			parent: () => (p: slime.jrunscript.file.Location) => slime.jrunscript.file.Location
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

		export interface Location {
			basename: (p: slime.jrunscript.file.Location) => string
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

		export interface Location {
			canonicalize: (p: slime.jrunscript.file.Location) => slime.jrunscript.file.Location
		}

		export interface Location {
			/** @deprecated Replaced by `directory.relativePath`. */
			relative: (path: string) => (p: slime.jrunscript.file.Location) => slime.jrunscript.file.Location
		}

		export interface Location {
			lastModified: {
				simple: slime.$api.fp.Mapping<slime.jrunscript.file.Location,number>
			}
		}

		export interface Location {
			posix: {
				attributes: {
					/**
					 * Returns the POSIX attributes for a given `Location`, if the `Location`'s file system supports POSIX
					 * attributes.
					 */
					get: slime.$api.fp.world.Sensor<{
						location: slime.jrunscript.file.Location
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
						location: slime.jrunscript.file.Location
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
						location: slime.jrunscript.file.Location
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
						jsh.file.Location.file.write.old(tmp).string,
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

					var getAttributes = function(tmp: slime.jrunscript.file.Location) {
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

	export namespace exports {
		export namespace location {
			export interface File {}
		}
	}

	export namespace exports {
		export interface Location {
			file: location.File
		}
	}

	export namespace exports {
		export namespace location {
			export interface File {
				size: slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, void, number>
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

	export namespace exports {
		export namespace location {
			export interface File {
				remove: {
					simple: slime.$api.fp.impure.Output<slime.jrunscript.file.Location>
					world: () => slime.$api.fp.world.Means<slime.jrunscript.file.Location,void>
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
					var write = jsh.file.world.Location.file.write.old(location);
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

		export namespace location {
			export interface File {
				exists: {
					simple: slime.$api.fp.Mapping<slime.jrunscript.file.Location,boolean>
					world: () => slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, {}, boolean>
				}

				read: {
					stream: () => slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, {
						notFound: void
					}, slime.$api.fp.Maybe<slime.jrunscript.runtime.io.InputStream>>

					string: {
						world: () => slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, {
							notFound: void
						}, slime.$api.fp.Maybe<string>>

						maybe: slime.$api.fp.Mapping<slime.jrunscript.file.Location, slime.$api.fp.Maybe<string>>

						simple: slime.$api.fp.Mapping<slime.jrunscript.file.Location, string>
					}

					properties: {
						simple: slime.$api.fp.Mapping<slime.jrunscript.file.Location, slime.jrunscript.java.Properties>
					}
				}

				write: {
					old: (location: slime.jrunscript.file.Location) => {
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
							var write = jsh.file.world.Location.file.write.old(location);
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
							var write = subject.Location.file.write.old(at);
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

	export namespace exports {
		export interface Location {
			directory: location.Directory
		}
	}

	export namespace exports {
		export interface Location {
			remove: {
				simple: slime.$api.fp.impure.Output<slime.jrunscript.file.Location>
			}
		}
	}

	export namespace exports {
		export interface Location {
			from: {
				os: (pathname: string) => slime.jrunscript.file.Location

				temporary: (filesystem: world.Filesystem) => slime.$api.fp.world.Sensor<
					{
						parent?: string
						prefix?: string
						suffix?: string
						directory: boolean
					},
					void,
					slime.jrunscript.file.Location
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

		export interface os {
			directory: {
				relativePath: (path: string) => (base: string) => string
			}

			temporary: {
				pathname: () => string
				location: () => slime.jrunscript.file.Location
				directory: () => string
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				fifty.tests.manual.os = {};

				fifty.tests.manual.os.relativePath = function() {
					var here = fifty.jsh.file.relative(".");
					jsh.shell.console(here.pathname);
					var there = $api.fp.now(here.pathname, jsh.file.os.directory.relativePath("foo/bar"));
					jsh.shell.console(there);
				}
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
				fifty.tests.suite = function() {
					fifty.load("wo-directory.fifty.ts");
					fifty.load("wo-filesystem.fifty.ts");

					fifty.run(fifty.tests.exports);
					fifty.run(fifty.tests.sandbox);
				}
			}
		//@ts-ignore
		)(fifty);
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
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
			loader: {
				Store: slime.runtime.loader.Exports["Store"]
			}
		}
		filesystem: {
			os: slime.jrunscript.file.world.Filesystem
		}
	}

	export interface Exports {
		Location: exports.Location
		Filesystem: exports.Filesystem
		os: exports.os
	}

	export type Script = slime.loader.Script<Context,Exports>
}
