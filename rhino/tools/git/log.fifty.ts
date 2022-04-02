//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git {
	export interface Exports {
		log: {
			format: {
				mask: string
				argument: string
				parse: (line: string) => Commit
			}
		}
	}
}

namespace slime.jrunscript.tools.git.internal.log {
	export interface Context {
		library: {
			time: slime.time.Exports
		}
	}

	export interface Exports {
		format: slime.jrunscript.tools.git.Exports["log"]["format"]
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
