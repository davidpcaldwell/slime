//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.documentation.wiki {
	export interface Context {
		httpd: slime.servlet.httpd

		library: {
			file: slime.jrunscript.file.Exports
		}

		/**
		 * The base directory **of the wiki**.
		 */
		base: slime.jrunscript.file.Directory
	}

	export type Export = slime.servlet.handler;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Export>
}
