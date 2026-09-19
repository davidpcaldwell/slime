//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.shell {
	export interface JshShellJsh {
		//	TODO	it is irregular for this member to be defined and declared and implemented in a completely separate hierarchy
		//			thatn the rest of `jsh.shell.jsh`. Should revisit.
		tools: slime.jsh.shell.jsh.tools.Plugin
	}
}

namespace slime.jsh.shell.jsh.tools {
	export interface Plugin {
		copyLauncherScripts: (
			src: slime.jrunscript.file.Directory,
			destination: {
				shell: slime.jrunscript.file.Directory
			}
		) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);
}
