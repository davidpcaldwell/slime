//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.browser.test.server {
	export type Export = (
		/** The directory to use when serving servlet resources, which is the SLIME directory for this purpose. */
		resources: slime.jrunscript.file.Directory,
		/** The base directory to serve, which is the common root for SLIME and the test file. */
		serve: slime.jrunscript.file.Directory,
		/** A path, relative to the served directory, that will both accept the result via POST and return it via GET. */
		resultsPath: string
	) => jsh.httpd.Tomcat

	export type Factory = slime.loader.Product<void,Export>
}