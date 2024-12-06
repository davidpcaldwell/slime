//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit.internal.remote {
	export interface Context {
		api: {
			java: slime.jrunscript.java.Exports
			unit: slime.jsh.unit.Exports
		}
	}

	export interface Exports {
		Events: any
		Decoder: any
		Stream: any
	}

	export type Script = slime.loader.Script<Context,Exports>
}
