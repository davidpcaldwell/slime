//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.browser.test.server {
	/**
	 * @param { slime.jrunscript.file.Directory } resources The directory to use when serving servlet resources, which is the SLIME directory for this purpose.
	 * @param { slime.jrunscript.file.Directory } serve The base directory to serve, which is the common root for SLIME and the test file.
	 * @param { string } resultsPath A path, relative to the served directory, that will both accept the result via POST and return it via GET.
	 */
	export interface Exports {
		create: (
			resources: slime.jrunscript.file.Directory,
			serve: slime.jrunscript.file.Directory,
			resultsPath: string
		) => jsh.httpd.Tomcat

		start: (p: {
			tomcat: slime.jsh.httpd.Tomcat
			resources: slime.jrunscript.file.Directory
			serve: slime.jrunscript.file.Directory
			resultsPath: string
		}) => void
	}
}

namespace slime.jsh.$fifty {
	export interface Exports {
		browser: {
			test: {
				server: slime.runtime.browser.test.server.Exports
			}
		}
	}
}
