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
	 * servlet handler that can serve project TypeDoc documentation from standard SLIME TypeDoc URLs given the httpd API.
	 */
	export type Export = (configuration: Configuration) => {
		handler: (p: slime.servlet.httpd) => slime.servlet.handler
		stop: () => void
	}

	export type Script = slime.loader.Script<void,Export>
}
