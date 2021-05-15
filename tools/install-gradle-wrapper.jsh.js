//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		jsh.shell.console("Adding Gradle wrapper to " + jsh.shell.PWD + " ...");

		//	First, check for the Gradle installation necessary for bootstrapping
		var GRADLE_LOCATION = jsh.shell.jsh.lib.getRelativePath("gradle");
		if (!GRADLE_LOCATION.directory) {
			jsh.tools.gradle.install();
		}

		jsh.shell.run({
			command: GRADLE_LOCATION.directory.getFile("bin/gradle"),
			arguments: [
				"wrapper"
			],
			directory: jsh.shell.PWD
		});
	}
//@ts-ignore
)(jsh);
