//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.oo {
	export interface Context {
		api: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}

		library: {
			world: slime.jrunscript.file.internal.java.Exports
		}

		pathext: slime.jrunscript.file.Context["pathext"]
		cygwin: slime.jrunscript.file.Context["cygwin"]
		addFinalizer: slime.jrunscript.file.Context["addFinalizer"]
	}

	export type Exports = Pick<slime.jrunscript.file.Exports,"filesystems"|"filesystem"|"Pathname"|"navigate"|"Searchpath"|"Loader"|"zip"|"unzip"|"list"|"state"|"action"|"object"|"Streams"|"java">

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.suite = function() {
				verify(jsh.file.Streams).is.type("object");

				fifty.load("oo/file.fifty.ts");
				fifty.load("oo/filesystem.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
