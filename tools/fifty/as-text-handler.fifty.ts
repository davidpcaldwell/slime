//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.documentation.internal.asTextHandler {
	export type Context = { httpd: slime.servlet.httpd }
	export type Export = slime.servlet.httpd["Handler"]["Loader"];

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * Given the `httpd` object (see {@link Context}), provides an object that can serve the contents of a Loader and
	 * understands the `as=text` query string.
	 */
	export type Script = slime.loader.Script<Context,Export>
}
