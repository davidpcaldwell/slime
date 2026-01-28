//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.remove {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type File = slime.$api.fp.world.sensor.api.Maybe<
		slime.jrunscript.file.Location,
		{
			error: string
		},
		void
	>

	/**
	 * A low-level API for removing a directory. This API should return a `Maybe` that is present if the operation succeeds, or
	 * not present if it fails. The operation should fail if the directory does not exist or is not empty.
	 */
	export type Directory = slime.$api.fp.world.sensor.api.Maybe<
		slime.jrunscript.file.Location,
		{
			error: string
		},
		void
	>

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const exists = {
				directory: jsh.file.Location.directory.exists.simple,
				file: jsh.file.Location.file.exists.simple
			};

			fifty.tests.exports.directory = fifty.test.Parent();

			//	TODO	are these sandbox tests?

			fifty.tests.exports.directory.happy = function() {
				var tmp = fifty.jsh.file.temporary.directory();

				verify(tmp).evaluate(exists.directory).is(true);

				jsh.file.Location.directory.remove.simple(tmp);

				verify(tmp).evaluate(exists.directory).is(false);
			};

			var remove = (
				function() {
					var error: string;

					var invoke = $api.fp.now(
						jsh.file.Location.directory.remove.wo,
						$api.fp.impure.tap(function() {
							error = null;
						}),
						$api.fp.world.Sensor.mapping({
							error: function(e) {
								error = e.detail;
							}
						})
					);

					return function(location: slime.jrunscript.file.Location) {
						var rv = invoke(location);
						return {
							result: rv,
							error: error
						};
					}
				}
			)();

			fifty.tests.exports.directory.notPresent = function() {
				var tmp = fifty.jsh.file.temporary.location();

				verify(tmp).evaluate(exists.directory).is(false);

				var result = remove(tmp);

				verify(result).result.present.is(false);
				verify(result).error.is("remove failed - does not exist: " + tmp.pathname);

				verify(tmp).evaluate(exists.directory).is(false);
			}


			fifty.tests.exports.directory.filePresent = function() {
				var tmp = fifty.jsh.file.temporary.location();

				var $$api = $api as slime.$api.jrunscript.Global;

				$api.fp.now(
					tmp,
					jsh.file.Location.file.write.open,
					$api.fp.property("simple"),
					function(x) {
						return x();
					},
					function(stream) {
						stream.pipe.simple(
							$$api.jrunscript.io.InputStream.string.default("")
						);
						stream.close();
					}
				)

				verify(tmp).evaluate(exists.directory).is(false);
				verify(tmp).evaluate(exists.file).is(true);

				var result = remove(tmp);

				verify(result).result.present.is(false);
				verify(result).error.is("remove failed - expected directory, was file: " + tmp.pathname);

				verify(tmp).evaluate(exists.directory).is(false);
				verify(tmp).evaluate(exists.file).is(true);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Events {
		notFound: void
		notEmpty: void
		error: string
		removing: slime.jrunscript.file.Location
		removed: slime.jrunscript.file.Location
	}

	/**
	 * High-level API for removing whatever is at a location (optionally including doing nothing if nothing is there).
	 */
	export type Location = (
		p?: {
			recursive?: boolean
			known?: boolean
		}
	) => slime.$api.fp.world.sensor.api.Maybe<
		slime.jrunscript.file.Location,
		slime.jrunscript.file.remove.Events,
		void
	>

	export namespace internal {
		export interface Context {
			Location_directory_exists: slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, {}, boolean>
			Location_file_exists: slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, {}, boolean>
			Location_is_symlink: slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, {}, boolean>
			list_stream: slime.jrunscript.file.location.directory.Exports["list"]["stream"]
		}

		export interface Exports {
			file: File["wo"]
			directory: Directory["wo"]
			location: (p: Parameters<Location>[0]) => ReturnType<Location>["wo"]
		}

		export type Script = slime.loader.synchronous.Script<Context,Exports>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);
}
