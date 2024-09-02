//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides constructs used for testing `jsh` remote shells.
 */
namespace slime.jsh.test.remote {
	export interface Settings {
		mock?: slime.jsh.unit.mock.Web
		branch?: string
		optimize?: boolean
		debug?: boolean
		token?: () => string
	}

	/**
	 * A mock hosted SLIME project; produces a mock web with a GitHub that hosts SLIME from a context-provided directory.
	 */
	export interface Exports {
		startMock: (jsh: slime.jsh.Global) => slime.jsh.unit.mock.Web

		/**
		 * Outputs a single string, suitable for use at the shell command line, that will invoke a shell with the given settings
		 * using tools (`curl` or `wget`) found on the given search path.
		 */
		getCommandLine: (p: {
			PATH: slime.jrunscript.file.Searchpath
			settings: Settings
			script: string
		}) => string

		getShellIntention: slime.jsh.test.shells.Remote["getShellIntention"]
	}
}

namespace slime.jrunscript.tools.github.internal.test {
	export interface Context {
		library: {
			shell: slime.jrunscript.shell.Exports
		}
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

	export type Script = slime.loader.synchronous.Script<Context,slime.jsh.test.remote.Exports>
}
