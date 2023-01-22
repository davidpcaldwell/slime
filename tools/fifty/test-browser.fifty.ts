//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.browser.test.internal {
	export interface Query {
		/** Whether to POST the result back to the server upon completion of the test suite. */
		results: "true" | "false"
		design: any
		file: any
		part: any
		delay: number
	}
}
