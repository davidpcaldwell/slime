//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.code.metrics {
	export interface Settings {
		excludes: slime.tools.code.Excludes

		isGenerated: slime.$api.fp.Predicate<slime.tools.code.File>
	}

	export type Script = slime.loader.Script<void,Settings>
}
