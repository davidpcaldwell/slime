//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.java.logging {
	type LevelMethod = (...args: any[]) => void

	export namespace old {
		export interface Logger {
			log: (level: any, ...args: any[]) => void
			SEVERE: LevelMethod
			WARNING: LevelMethod
			INFO: LevelMethod
			CONFIG: LevelMethod
			FINE: LevelMethod
			FINER: LevelMethod
			FINEST: LevelMethod
		}

		export interface Exports {
			(...args: any[]): void
			named(name: string): Logger
			initialize: (f: (record: any) => void) => void
		}
	}

	export interface Level {

	}

	export interface Exports {
		log: (p: {
			logger: string
			level: "SEVERE" | "WARNING" | "INFO" | "CONFIG" | "FINE" | "FINER" | "FINEST"
			message: string
		}) => void
	}
}

namespace slime.jrunscript.java.internal.logging {
	export interface Context {
		api: {
			java: {
				Array: slime.jrunscript.java.Exports["Array"]
			}
		}
		prefix: string
	}

	export interface Exports {
		old: slime.jrunscript.java.logging.old.Exports
		api: slime.jrunscript.java.logging.Exports
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
