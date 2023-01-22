//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit.mock.github {
	export interface Settings {
		mock?: slime.jsh.unit.mock.Web
		branch?: string
		optimize?: boolean
		debug?: boolean
		token?: () => string
	}

	export interface Exports {
		startMock: (jsh: slime.jsh.Global) => slime.jsh.unit.mock.Web

		getDownloadJshBashCommand: (PATH: slime.jrunscript.file.Searchpath, options: Pick<slime.jsh.unit.mock.github.Settings,"mock" | "token" | "branch">) => string[]

		getBashInvocationCommand: (options: slime.jsh.unit.mock.github.Settings) => string[]

		/**
		 * Outputs a single string, suitable for use at the shell command line, that will invoke a shell with the given settings
		 * using tools (`curl` or `wget`) found on the given search path.
		 */
		getCommandLine: (PATH: slime.jrunscript.file.Searchpath, settings: slime.jsh.unit.mock.github.Settings) => string
	}
}

namespace slime.jrunscript.tools.github.internal.test {
	export interface Context {
		slime: slime.jrunscript.file.Directory
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

	export type Script = slime.loader.synchronous.Script<Context,slime.jsh.unit.mock.github.Exports>
}
