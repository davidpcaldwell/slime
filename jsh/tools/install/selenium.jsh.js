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
		var parameters = jsh.script.getopts({
			options: {
				url: "https://github.com/SeleniumHQ/selenium/releases/download/selenium-4.1.0/selenium-java-4.1.0.zip"
			}
		});

		jsh.tools.install.install({
			url: parameters.options.url,
			getDestinationPath: function(file) { return ""; },
			to: jsh.shell.jsh.lib.getRelativePath("selenium")
		});
	}
//@ts-ignore
)(jsh);
