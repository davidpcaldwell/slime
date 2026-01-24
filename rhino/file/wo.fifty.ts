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

	//	TODO	move to module.fifty.ts
	export interface Exports {
		Location: location.Exports

		Filesystem: filesystem.Exports

		os: location.os
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

	export namespace location {
		export interface Exports {
			from: From
		}
	}

	export namespace location {
		export interface Exports {
			pathname: (p: slime.jrunscript.file.Location) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const subject = fifty.global.jsh.file;

				fifty.tests.exports.Location.pathname = function() {
					var pathname = "/a/b/c";
					var location = subject.Location.from.os(pathname);
					verify(location).evaluate(subject.Location.pathname).is(pathname);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
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

		export interface Exports {
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

		export interface Exports {
			canonicalize: (p: slime.jrunscript.file.Location) => slime.jrunscript.file.Location
		}

		export interface Exports {
			/** @deprecated Replaced by `directory.relativePath`. */
			relative: (path: string) => (p: slime.jrunscript.file.Location) => slime.jrunscript.file.Location
		}
	}

	export type Attribute<T, Writable extends boolean> = {
		get: slime.$api.fp.world.Question<void,T>;
	} & (
		Writable extends true
		? {
			set: slime.$api.fp.world.Means<T,void>
		}
		: {
		}
	);

	export interface Attributes {
		size: Attribute<number,false>
		times: {
			created: Attribute<slime.external.lib.es5.TimeValue,true>
			modified: Attribute<slime.external.lib.es5.TimeValue,true>
			accessed: Attribute<slime.external.lib.es5.TimeValue,true>
		}
	}

	export namespace location {
		export interface Exports {
			attributes: (location: Location) => Attributes
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { jsh } = fifty.global;
				const $api = fifty.global.$api as slime.$api.jrunscript.Global;
				const { Location } = fifty.global.jsh.file;

				fifty.tests.exports.Location.attributes = function() {
					var date: slime.time.Datetime = {
						year: 2021,
						month: 1,
						day: 20,
						hour: 12,
						minute: 0,
						second: 0
					};

					var eastern = jsh.time.Timezone["America/New_York"];

					var file = fifty.jsh.file.temporary.location();

					var attributes = Location.attributes(file);

					var size = $api.fp.now(
						attributes.size.get,
						function(q) {
							return function() {
								return $api.fp.world.Question.now({ question: q });
							}
						}
					);

					//	TODO	what if we call lastModified before file exists?

					jsh.file.Location.file.write.open(file).simple().pipe.simple($api.jrunscript.io.InputStream.string.default("hey"));

					debugger;
					verify(size()).is(3);

					//	TODO	provide simple API for this
					var lastModified = $api.fp.now(
						attributes.times.modified.get,
						function(q) {
							return function() {
								return $api.fp.world.Question.now({ question: q })
							}
						}
					);

					//	TODO	provide simple API for this
					var created = $api.fp.now(
						attributes.times.created.get,
						function(q) {
							return function() {
								return $api.fp.world.Question.now({ question: q })
							}
						}
					);

					//	TODO	provide simple API for this
					var accessed = $api.fp.now(
						attributes.times.accessed.get,
						function(q) {
							return function() {
								return $api.fp.world.Question.now({ question: q })
							}
						}
					);

					//	TODO	provide simple API for this
					var setLastModified = $api.fp.now(
						attributes.times.modified.set,
						$api.fp.world.Means.effect()
					);

					//	TODO	provide simple API for this
					var setCreated = $api.fp.now(
						attributes.times.created.set,
						$api.fp.world.Means.effect()
					);

					//	TODO	provide simple API for this
					var setAccessed = $api.fp.now(
						attributes.times.accessed.set,
						$api.fp.world.Means.effect()
					);

					var initialLastModified = lastModified();

					var major = jsh.internal.bootstrap.java.getMajorVersion();

					//	Under JDK 8, filesystem timestamp resolution appears to be to the second (or two seconds?)
					var GAP = (major == 8) ? 2000 : 100;

					jsh.java.Thread.sleep(GAP);

					jsh.file.Location.file.write.open(file).simple().pipe.simple($api.jrunscript.io.InputStream.string.default("now"));

					var secondLastModified = lastModified();

					verify(secondLastModified - initialLastModified >= GAP).is(true);

					//	TODO	time API?
					var HOUR = 60 * 60 * 1000;

					setLastModified(eastern.unix(date));
					setCreated(eastern.unix(date) - HOUR);
					setAccessed(eastern.unix(date) + HOUR);

					verify(eastern.local(lastModified()), "thirdLastModified", function(it) {
						it.year.is(date.year);
						it.month.is(date.month);
						it.day.is(date.day);
						it.hour.is(date.hour);
						it.minute.is(date.minute);
						it.second.is(date.second);
					});

					if (jsh.shell.os.name == "Mac OS X") {
						verify(eastern.local(created()), "thirdCreated", function(it) {
							it.year.is(date.year);
							it.month.is(date.month);
							it.day.is(date.day);
							it.hour.is(date.hour - 1);
							it.minute.is(date.minute);
							it.second.is(date.second);
						});
					} else if (jsh.shell.os.name == "Linux") {
						//	do nothing; cannot update created time so it will be the value given by the system clock
					} else {
						//	who knows
					}

					verify(eastern.local(accessed()), "thirdAccessed", function(it) {
						it.year.is(date.year);
						it.month.is(date.month);
						it.day.is(date.day);
						it.hour.is(date.hour + 1);
						it.minute.is(date.minute);
						it.second.is(date.second);
					});
				}

				fifty.tests.manual.Location = {};

				fifty.tests.manual.Location.attributes = function() {
					var target = fifty.jsh.file.relative("./wo.js");
					var attributes = Location.attributes(target);
					var size = $api.fp.now(
						attributes.size.get,
						function(q) {
							return function() {
								return $api.fp.world.Question.now({ question: q })
							}
						}
					);
					jsh.shell.console("size of " + target.pathname + " = " + size());

					var lastModified = $api.fp.now(
						attributes.times.modified.get,
						function(q) {
							return function() {
								return $api.fp.world.Question.now({ question: q })
							}
						}
					);

					jsh.shell.console("lastModified of " + target.pathname + " = " + new Date(lastModified()));
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace location {
		export interface Exports {
			remove: (
				p?: {
					recursive?: boolean
					known?: boolean
				}
			) => slime.$api.fp.world.sensor.api.Maybe<
				slime.jrunscript.file.Location,
				slime.jrunscript.file.location.directory.remove.Events,
				void
			>
		}
	}

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

	export namespace location {
		export interface From {
			java: {
				File: (_file: slime.jrunscript.native.java.io.File) => Location
			}
		}

		export interface Exports {
			java?: {
				File: {
					simple: (location: Location) => slime.jrunscript.native.java.io.File
					maybe: (location: Location) => slime.$api.fp.Maybe<slime.jrunscript.native.java.io.File>
				}
			}
		}
	}

	export namespace location {
		export interface Exports {
			Function: <T>(p: {
				directory: (directory: Location) => T
				file: (file: Location) => T
			}) => (p: Location) => T
		}
	}

	export namespace location {
		export namespace file {
			export interface Exports {}
		}
	}

	export namespace location {
		export interface Exports {
			file: file.Exports
		}
	}

	export namespace location {
		export namespace file {
			export interface Exports {
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

	export namespace location {
		export namespace file {
			//	TODO	redundant; we have Location.remove and should merge them
			export interface Exports {
				remove: slime.$api.fp.world.sensor.api.Maybe<
					slime.jrunscript.file.Location,
					{
						error: string
					},
					slime.$api.fp.Maybe<void>
				>
			}
		}
	}

	export namespace location {
		export interface From {
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
						directory: $api.fp.world.mapping(Location.directory.exists.wo)
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
			directory: slime.jrunscript.file.wo.directory.os

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

		export namespace file {
			export interface Exports {
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

					open: (location: slime.jrunscript.file.Location) => slime.$api.fp.world.sensor.api.Maybe<
						{ append?: boolean, recursive?: boolean } | void,
						slime.jrunscript.file.world.events.FileOpenForWrite,
						slime.jrunscript.runtime.io.OutputStream
					>
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

		export interface Exports {
			directory: directory.Exports
		}

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
		Location: location.Exports
		Filesystem: filesystem.Exports
		os: location.os
	}

	export type Script = slime.loader.Script<Context,Exports>
}
