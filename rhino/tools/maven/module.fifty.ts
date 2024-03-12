//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.maven {
	export interface Context {
		HOME: slime.jrunscript.file.Directory
		java: slime.jrunscript.shell.Exports["java"]
		mvn: any

		jsh: {
			js: slime.js.old.Exports & {
				document: any
			}
			io: slime.jrunscript.io.Exports
			shell: slime.jsh.shell.Exports
			document: slime.jsh.Global["document"]
		}
	}

	export interface Exports {
		mvn: any
		Pom: any
		Project: any
		Repository: any
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

	export type Script = slime.loader.Script<Context,Exports>
}
