//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client.internal.cookies {
	export interface Export {
		inonit: () => slime.jrunscript.http.client.internal.Cookies
		java: () => slime.jrunscript.http.client.internal.Cookies
	}

	export type Load = slime.loader.Product<void,Export>
}

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.suite = function() {

		}
	}
//@ts-ignore
)(fifty);
