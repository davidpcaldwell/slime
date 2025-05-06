//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.loader.internal.test.store {
	export interface Context {
		n: number
	}

	export interface Exports {
		calculated: part.Exports
	}

	export type Script = slime.runtime.loader.Module<Context,Exports>

	export namespace part {
		export interface Context {
			x: number
		}

		export interface Exports {
			doubled: number
			squared: number
		}

		export type Script = slime.runtime.loader.Module<Context,Exports>
	}
}
