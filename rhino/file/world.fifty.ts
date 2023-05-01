//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export namespace world {
		export interface Filesystem {
			separator: {
				pathname: string
				searchpath: string
			}
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
			},slime.$api.fp.Maybe<string[]>>

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

				fifty.tests.spi.filesystem = function(filesystem: Filesystem) {
					//	TODO	need better way to run this style of test
					fifty.tests.spi.filesystem.openInputStreamNotFound(filesystem);
					fifty.tests.spi.filesystem.relative(filesystem);
				};
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
	}

	export namespace world {
		export interface Exports {
			filesystems: {
				os: Filesystem
			}
		}
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
				var relative = world.filesystems.os.relative(folder, file);
				jsh.shell.console(relative);
				var relative2 = world.filesystems.os.relative(pathname, "foo");
				jsh.shell.console(relative2);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.suite = function() {
				//	TODO	possibly these tests should be moved somewhere? Into the Java-specific file?
				fifty.load("world.fifty.ts", "spi.filesystem", jsh.file.world.filesystems.os);
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
	}

	export interface Exports extends slime.jrunscript.file.world.Exports {
		Location: slime.jrunscript.file.location.Exports

		providers: {
			os: slime.jrunscript.file.internal.java.FilesystemProvider
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}
