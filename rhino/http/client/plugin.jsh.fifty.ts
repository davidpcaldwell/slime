//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		http: slime.jrunscript.http.client.Exports & {
			test: {
				/**
				 * Disables SSL verification for the Java VM in which the shell is running.
				 */
				disableHttpsSecurity: () => void
			}
		}
	}
}