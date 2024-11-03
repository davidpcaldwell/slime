//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

import it from "../eslint.config.js";

var rules = it.reduce( (rv,config) => {
	if (config.rules) {
		Object.assign(rv, config.rules);
	}
	return rv;
}, {});

console.log(JSON.stringify(rules));
