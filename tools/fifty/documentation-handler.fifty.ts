//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.documentation {
	export interface Configuration {
		base: slime.jrunscript.file.Directory
		watch?: boolean
	}

	/**
	 * The application-level export of the documentation handler. Using a configuration, creates a function capable of creating a
	 * servlet handler that can serve Typedoc documentation given the httpd API.
	 */
	export type implementation = (configuration: Configuration) => factory

	export type Export = implementation

	export type factory = (p: slime.servlet.httpd) => slime.servlet.handler

	export namespace internal.asTextHandler {
		export type Context = { httpd: slime.servlet.httpd }
		export type Export = slime.servlet.httpd["Handler"]["Loader"];
		/**
		 * Given the `httpd` object (see {@link Context}), provides an object that can serve the contents of a Loader and
		 * understands the `as=text` query string.
		 */
		export type Factory = slime.loader.Script<Context,Export>
	}
}