//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Exports {
		mock: {
			/**
			 * Produces a mock filesystem implementation that operates in memory only.
			 *
			 * @param p
			 * @returns
			 */
			filesystem: (p?: {
				separator?: {
					pathname?: string
					searchpath?: string
				}
			}) => slime.jrunscript.file.world.Filesystem
		}
	}
}

namespace slime.jrunscript.file.internal.mock {
	export interface Context {
		library: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}
	}

	export type Exports = slime.jrunscript.file.Exports["mock"]

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script: Script = fifty.$loader.script("mock.js");
			var module = script({
				library: {
					java: fifty.global.jsh.java,
					io: fifty.global.jsh.io
				}
			});

			fifty.tests.suite = function() {
				fifty.load("world.fifty.ts", "spi.filesystem.relative", module.filesystem());
				fifty.load("world.fifty.ts", "spi.filesystem.openInputStreamNotFound", module.filesystem());
			};

			fifty.tests.manual = {};
			fifty.tests.manual.fixtures = function() {
				var code: slime.jrunscript.file.test.fixtures.Script = fifty.$loader.script("fixtures.ts");
				var fixtures = code({
					fifty: fifty
				});

				var x = fixtures.Filesystem.from.descriptor({
					contents: {
						a: {
							text: "aa"
						}
					}
				});

				var location: slime.jrunscript.file.world.Location = {
					filesystem: x,
					pathname: "a"
				};

				var text = $api.fp.world.now.question(
					jsh.file.world.Location.file.read.string(),
					location
				);

				verify(text).present.is(true);
				if (text.present) {
					verify(text).value.is("aa");
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
