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
		var URL = "https://coffeescript.org/v2/browser-compiler-legacy/coffeescript.js";
		var DESTINATION = jsh.shell.jsh.lib.getRelativePath("coffee-script.js");

		var parameters = jsh.script.getopts({
			options: {
				url: URL
			}
		});

		var file = jsh.tools.install.get({
			url: parameters.options.url
		});

		if (file.length == 16) {
			jsh.shell.console("Downloading CoffeeScript is currently blocked by CloudFlare.");
			jsh.shell.console([
				"It can be downloaded manually from:",
				"https://coffeescript.org/v2/browser-compiler-legacy/coffeescript.js",
				"and stored at ",
				jsh.shell.jsh.src.getRelativePath("local/jsh/lib/coffee-script.js"),
				"and the shell will pick it up there."
			].join("\n"));
			jsh.shell.exit(1);
		}

		jsh.shell.console("Writing CoffeeScript to " + DESTINATION + " ...");
		file.copy(DESTINATION);
	}
//@ts-ignore
)(jsh);
