//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
	export interface Global {
		deprecate: {
			(o: object, property: string): void
			<T extends slime.external.lib.es5.Function>(f: T): T
			warning: any
		}
		experimental: {
			(o: object, property: string): void
			<T extends slime.external.lib.es5.Function>(f: T): T
		}
	}
}
