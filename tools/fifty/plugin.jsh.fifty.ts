//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Unsupported API. `jsh` plugin used in implementing `fifty.jsh` APIs.
 */
namespace slime.jsh.$fifty {
	export interface Exports {
		plugin: {
			mock: slime.jsh.plugin.$slime["plugins"]["mock"]
		}
	}
}

namespace slime.jsh {
	export interface Global {
		/**
		 * Unsupported API. Used in implementation of the {@link slime.fifty Fifty} tools.
		 */
		$fifty: slime.jsh.$fifty.Exports
	}
}
