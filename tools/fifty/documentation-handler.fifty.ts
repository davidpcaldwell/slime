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
	 * servlet handler that can serve project TypeDoc documentation from standard SLIME TypeDoc URLs given the httpd API. It also
	 * supports linking to the project code via the `src/` path (and these links support the `as=text` query parameter). Finally,
	 * it supports the `local/doc/typedoc/update` endpoint for forcing a regeneration of the documentation, and regeneration for
	 * every `.html` request when `configuration.watch` is `true`.
	 */
	export type Export = (configuration: Configuration) => (httpd: slime.servlet.httpd) => slime.servlet.Script

	export type Script = slime.loader.Script<void,Export>
}
