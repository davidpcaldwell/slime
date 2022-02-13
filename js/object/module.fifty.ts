//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * An older module containing general JavaScript utilities. Replaced by {@link slime.$api.Global}.
 */
namespace slime.js.old {
	export interface Context {
		globals: boolean
	}

	export interface Exports {
		undefined: void
		defined: any
		constant: any
		lazy: any
		toLiteral: any
		ObjectTransformer: any
		properties: any
		Object: any
		Filter: any
		Map: any
		Order: any
		Array: any
		Error: any
		Task: any

		Function: slime.$api.Global["Function"]

		/**
		 * @deprecated
		 */
		deprecate: slime.$api.Global["deprecate"]
	}
}