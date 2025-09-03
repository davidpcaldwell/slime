//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.thread {
	export namespace type {
		export type Asynchronous<T> = {
			[K in keyof T]: T[K] extends slime.external.lib.es5.Function<infer A, infer B, infer C>
				? slime.external.lib.es5.Function<A, B, Promise<C>>
				: T[K]
		}
	}
}
