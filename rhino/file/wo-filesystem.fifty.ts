//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.filesystem {
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

			fifty.tests.sandbox = fifty.test.Parent();

			fifty.tests.sandbox.filesystem = fifty.test.Parent();

			fifty.tests.sandbox.filesystem.file = fifty.test.Parent();

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
}


namespace slime.jrunscript.file.internal.wo.filesystem {
	export interface Context {
		ensureParent: slime.$api.fp.world.Means<slime.jrunscript.file.Location, { created: slime.jrunscript.file.Location }>
	}

	export type Exports = slime.jrunscript.file.filesystem.Exports;

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

	export type Script = slime.loader.Script<Context,Exports>
}
