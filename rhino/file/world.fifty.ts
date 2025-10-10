//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export namespace world {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.world = {};
			}
		//@ts-ignore
		)(fifty);

		export interface Filesystem {
			separator: {
				pathname: string
				searchpath: string
			}
		}

		export namespace events {
			export interface FileOpenForWrite {
				parentNotFound: slime.jrunscript.file.Location
				createdFolder: slime.jrunscript.file.Location
			}
		}

		export interface Filesystem {
			canonicalize: slime.$api.fp.world.Sensor<{
				pathname: string
			},void,slime.$api.fp.Maybe<string>>

			fileExists: slime.$api.fp.world.Sensor<{
				pathname: string
			},void,slime.$api.fp.Maybe<boolean>>

			fileSize: slime.$api.fp.world.Sensor<{
				pathname: string
			},void,slime.$api.fp.Maybe<number>>

			/**
			 * Returns the time the file was last modified.
			 *
			 * Will return `Maybe.from.nothing()` if the file does not exist.
			 *
			 * Some filesystems may not be able to return a last modified date, so this returns a `Maybe`.
			 */
			fileLastModified: slime.$api.fp.world.Sensor<{
				pathname: string
			},void,slime.$api.fp.Maybe<slime.external.lib.es5.TimeValue>>

			openOutputStream: slime.$api.fp.world.Sensor<{
				pathname: string
				append?: boolean
			},events.FileOpenForWrite,slime.$api.fp.Maybe<slime.jrunscript.runtime.io.OutputStream>>

			directoryExists: slime.$api.fp.world.Sensor<{
				pathname: string
			},void,slime.$api.fp.Maybe<boolean>>

			createDirectory: slime.$api.fp.world.Means<{
				pathname: string
			},{
			}>

			listDirectory: slime.$api.fp.world.Sensor<{
				pathname: string
			},{
			},slime.$api.fp.Maybe<string[]>>

			copy: slime.$api.fp.world.Means<{
				from: string
				to: string
			},void>

			move: slime.$api.fp.world.Means<{
				from: string
				to: string
			},void>

			remove: slime.$api.fp.world.Means<{
				pathname: string
			},void>

			java?: {
				codec: {
					/**
					 * If this filesystem represents a filesystem consisting of actual Java files, this operation supports the
					 * conversion of pathname strings to native `java.io.File` objects.
					 */
					File: slime.Codec<{ pathname: string },slime.jrunscript.native.java.io.File>
				}
			}
		}

		export type Attribute<T, Writable extends boolean> = {
			get: slime.$api.fp.world.Sensor<{ pathname: string },void,T>;
		} & (
			Writable extends true
			? {
				set: (p: { pathname: string }) => slime.$api.fp.world.Means<T,void>
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

		export interface Filesystem {
			attributes: {
				size: Attribute<number,false>
				times: {
					created: Attribute<slime.external.lib.es5.TimeValue,true>
					modified: Attribute<slime.external.lib.es5.TimeValue,true>
					accessed: Attribute<slime.external.lib.es5.TimeValue,true>
				}
			}
		}

		export interface Filesystem {
			posix?: {
				attributes: {
					get: slime.$api.fp.world.Sensor<
						{
							pathname: string
						},
						void,
						file.posix.Attributes
					>

					set: slime.$api.fp.world.Means<
						{
							pathname: string
							attributes: file.posix.Attributes
						},
						void
					>
				}
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				fifty.tests.world.posix = {};

				fifty.tests.world.posix.get = function() {
					var filesystem = jsh.file.world.filesystems.os;
					jsh.shell.console("filesystem = " + filesystem);
					jsh.shell.console("filesystem.posix = " + filesystem.posix);

					var attributes = $api.fp.world.now.ask(
						filesystem.posix.attributes.get({ pathname: fifty.jsh.file.relative("world.fifty.ts").pathname })
					);
					jsh.shell.console(JSON.stringify(attributes));
				}


				fifty.tests.world.posix.set = function() {
					var tmp = fifty.jsh.file.temporary.location();
					$api.fp.world.now.action(
						jsh.file.Location.file.write.old(tmp).string,
						{ value: "" }
					);

					var attributes = $api.fp.world.now.ask(
						//	TODO	need Location API for this
						tmp.filesystem.posix.attributes.get({ pathname: tmp.pathname })
					);
					jsh.shell.console(JSON.stringify(attributes));

					$api.fp.world.now.action(
						tmp.filesystem.posix.attributes.set,
						{
							pathname: tmp.pathname,
							attributes: {
								owner: attributes.owner,
								group: attributes.group,
								permissions: {
									owner: { read: true, write: true, execute: true },
									group: { read: true, write: false, execute: true },
									others: { read: false, write: false, execute: false }
								}
							}
						}
					);

					var after = $api.fp.world.now.ask(
						tmp.filesystem.posix.attributes.get({ pathname: tmp.pathname })
					);

					jsh.shell.console(JSON.stringify(after,void(0),4));
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Filesystem {
			/**
			 * Creates a temporary file with a generated pathname. The returned value is the full pathname of the created file.
			 * The `parent` value specifies a directory in which to create fhe file. The `prefix` and `suffix` can be used to affect
			 * the name of the created file. The `directory` property affects whether a directory is created at the location or an
			 * ordinary file is created.
			 */
			//	TODO	what if parent does not exist?
			temporary: slime.$api.fp.world.Sensor<
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

				fifty.tests.spi.filesystem = function(filesystem: Filesystem) {
					//	TODO	need better way to run spi test that has subtests, like fifty.test.Parent
					fifty.run(function openInputStreamNotFound() {
						fifty.tests.spi.filesystem.openInputStreamNotFound(filesystem)
					});
					fifty.run(function openOutputStream() {
						fifty.tests.spi.filesystem.openOutputStream(filesystem)
					});
				};
			}
		//@ts-ignore
		)(fifty);

		export interface Filesystem {
			openInputStream: slime.$api.fp.world.Sensor<{
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
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.spi.filesystem.openOutputStream = function(subject: Filesystem) {
					var asLocation: slime.js.Cast<slime.jrunscript.file.Location> = $api.fp.cast.unsafe;
					//	TODO	no testing for this API; does a file exist
					var at = $api.fp.world.now.ask(subject.temporary({ directory: true }));
					debugger;

					var tmp: slime.jrunscript.file.Location = {
						filesystem: subject,
						pathname: at
					};

					fifty.run(
						function happy() {
							var captor = fifty.$api.Events.Captor({
								parentNotFound: tmp
							});

							var openForWrite = $api.fp.world.now.ask(
								subject.openOutputStream({
									pathname: at + subject.separator.pathname + "baz"
								}),
								captor.handler
							);
							verify(openForWrite.present).is(true);
							verify(captor).events.length.is(0);
						}
					);

					fifty.run(
						function parentNotFound() {
							var captor = fifty.$api.Events.Captor({
								parentNotFound: tmp
							});

							var openForWrite = $api.fp.world.now.ask(
								subject.openOutputStream({
									pathname: at + subject.separator.pathname + "foo" + subject.separator.pathname + "bar"
								}),
								captor.handler
							);
							verify(openForWrite.present).is(false);
							verify(captor).events.length.is(1);
							verify(captor).events[0].type.is("parentNotFound");
							verify(captor).events[0].detail.evaluate(asLocation).pathname.is(at + subject.separator.pathname + "foo");
						}
					);
				}
			}
		//@ts-ignore
		)(fifty);

	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;
			const { world } = jsh.file;

			fifty.tests.manual = {};

			fifty.tests.manual.world = function() {
				var pathname = fifty.jsh.file.object.getRelativePath("module.fifty.ts").toString();
				var contents = $api.fp.impure.now.input(
					$api.fp.world.input(
						world.filesystems.os.File.read.string({ pathname: pathname })
					)
				);
				jsh.shell.console(contents.substring(0,500));

				var folder = fifty.jsh.file.object.getRelativePath(".").toString();
				var file = "module.fifty.ts";

				var filesystems_os_relative = function(folder: string, file: string) {
					return jsh.file.Location.directory.base(
						jsh.file.Location.from.os(folder)
					)(file).pathname;
				}

				var relative = filesystems_os_relative(folder, file);
				jsh.shell.console(relative);
				var relative2 = filesystems_os_relative(pathname, "foo");
				jsh.shell.console(relative2);
			}
		}
	//@ts-ignore
	)(fifty);
}
