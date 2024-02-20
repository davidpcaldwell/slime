//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.mock {
	export interface Context {
		library: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}
	}

	export interface Exports {
		filesystem: slime.jrunscript.file.Exports["world"]["filesystems"]["mock"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script: Script = fifty.$loader.script("mock.js");

			var subject = script({
				library: {
					java: fifty.global.jsh.java,
					io: fifty.global.jsh.io
				}
			});

			fifty.tests.fixtures = function() {
				var code: slime.loader.Script<Context,slime.jrunscript.file.mock.Fixtures> = fifty.$loader.script("mock.fixtures.ts");

				var fixtures = code({
					library: {
						java: jsh.java,
						io: jsh.io
					}
				});

				var x = fixtures.Filesystem.from.descriptor({
					contents: {
						a: {
							text: "aa"
						},
						b: {
							contents: {
								c: {
									text: "cc"
								}
							}
						}
					}
				});

				var location: slime.jrunscript.file.Location = {
					filesystem: x,
					pathname: "/a"
				};

				var text = $api.fp.world.now.question(
					jsh.file.world.Location.file.read.string.world(),
					location
				);

				verify(text).present.is(true);
				if (text.present) {
					verify(text).value.is("aa");
				}

				var c: slime.jrunscript.file.Location = {
					filesystem: x,
					pathname: "/b/c"
				};

				var cc = $api.fp.now.map(
					c,
					jsh.file.world.Location.file.read.string.assert
				);

				verify(cc).is("cc");
			}

			fifty.tests.suite = function() {
				fifty.load("world.fifty.ts", "spi.filesystem", subject.filesystem());

				fifty.run(fifty.tests.fixtures);
			};

			//	Convenience method to support building out world.fifty.ts tests using this mock implementation
			fifty.tests.wip = function() {
				fifty.load("world.fifty.ts", "spi.filesystem.wip", subject.filesystem());
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
