//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.internal.events {
	export interface Context {
		deprecate: slime.$api.Global["deprecate"]
	}

	export interface Export {
		create: (p?: {
			source?: any
			parent?: slime.$api.Events<any>
			getParent?: () => slime.$api.Events<any>
			on?: { [x: string]: any }
		}) => slime.$api.Events<any>

		Function: slime.$api.Global["Events"]["Function"]
		toHandler: slime.$api.Global["Events"]["toHandler"]
		action: slime.$api.Global["Events"]["action"]

		ask: slime.$api.fp.Exports["impure"]["ask"]
		tell: slime.$api.fp.Exports["impure"]["tell"]
	}
}