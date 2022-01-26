//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides a **very rough**, **experimental** drop-in replacement for the {@link slime.jrunscript.http.client.World}
 * `request` method that is implemented in terms of `curl`.
 *
 * Currently, `curl` must be on the `PATH` in order for this method to work, and it has several limitations:
 *
 * * it does not return status codes or headers
 * * it only accepts request bodies that are string data
 * * it only handles responses containing string data
 * * it does not support the read timeout supported by the `request` method
 */
namespace slime.jrunscript.http.client.curl {
	export interface Context {
		console: (message: string) => void
		library: {
			shell: slime.jrunscript.shell.Exports
		}
	}

	export type Exports = slime.jrunscript.http.client.Exports["world"]["request"]

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
