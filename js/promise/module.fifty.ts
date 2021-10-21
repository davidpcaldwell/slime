//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/** @deprecated */
namespace slime.promise {
	export interface Context {
		Promise: PromiseConstructor
	}

	export interface Export {
		/** @deprecated */
		Promise: PromiseConstructor & {
			new (p: { delegate: any, target: any }): Promise<any>
		}
		/** @deprecated */
		Controlled: any
	}
}