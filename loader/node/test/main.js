//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		/** @type { slime.node.Exports } */
		var slime = require("../loader.js");
		console.log(slime.runtime.$api.Function.identity(3));
	}
)();
