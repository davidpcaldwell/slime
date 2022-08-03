//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit.mock.github.test {
	export interface Context {
		slime: slime.jrunscript.file.Directory
	}

	export interface Settings {
		mock?: slime.jsh.unit.mock.Web
		optimize?: boolean
		debug?: boolean
		token?: () => string
	}

	export interface Exports {
		startMock: (jsh: slime.jsh.Global) => slime.jsh.unit.mock.Web

		/**
		 * Outputs a single string, suitable for use at the shell command line, that will invoke a shell with the given settings
		 * using tools (`curl` or `wget`) found on the given search path.
		 */
		getCommandLine: (PATH: slime.jrunscript.file.Searchpath, settings: Settings) => string
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
