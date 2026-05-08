//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.project {
	export interface Exports {
		suite: {
			/**
			 * Performs a series of steps to prepare for test suites:
			 *
			 * * Installs Rhino
			 * * Installs Tomcat
			 * * Installs TypeScript
			 * * (If indicated) Installs Selenium
			 */
			initialize: (p: {
				selenium: boolean
			}) => void

			Environment: slime.project.internal.jrunscript_environment.Exports

			run: (p: {
				suite: any
				view: string
				port: any
				part: string
			}) => void
		}
	}
}
