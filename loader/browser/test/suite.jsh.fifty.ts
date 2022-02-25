//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.browser.test {
	export namespace results {
		export interface Context {
			library: {
				java: slime.jsh.Global["java"]
				shell: slime.jsh.Global["shell"]
			}
		}

		interface Configuration {
			url: string
		}

		export type Factory = (configuration: Configuration) => slime.servlet.handler
	}
}
