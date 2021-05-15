//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.$fifty {
	//	TODO	should be making this available as part of Fifty object
	interface Exports {
		plugin: {
			mock: slime.jsh.loader.internal.plugins.Export["mock"]
		}
	}
}

namespace slime.jsh {
	interface Global {
		$fifty: slime.jsh.$fifty.Exports
	}
}

