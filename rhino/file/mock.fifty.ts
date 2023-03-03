//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.mock {
	export interface Context {
		library: {
			io: slime.jrunscript.io.Exports
		}
	}

	export type Exports = slime.jrunscript.file.Exports["mock"]

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var script: Script = fifty.$loader.script("mock.js");
			var module = script({
				library: {
					io: fifty.global.jsh.io
				}
			});

			fifty.tests.suite = function() {
				fifty.load("world.fifty.ts", "spi.filesystem.relative", module.filesystem());
				fifty.load("world.fifty.ts", "spi.filesystem.openInputStreamNotFound", module.filesystem());
			};
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
