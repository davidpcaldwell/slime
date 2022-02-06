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

		var library = jsh.shell.jsh.lib.getRelativePath("selenium/java");

		if (!library.directory) {
			jsh.tools.install.install({
				url: parameters.options.url,
				getDestinationPath: function(file) { return ""; },
				to: library
			});
		}

		var majorVersion = (function(chrome) {
			if (!chrome) return null;
			return jsh.shell.browser.Chrome.getMajorVersion(chrome);
		})(jsh.shell.browser.chrome);
		jsh.shell.console("Chrome major version: " + majorVersion);

		var latestVersion = (function() {
			var response = jsh.http.world.request({
				request: {
					method: "GET",
					url: "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_" + majorVersion,
					headers: []
				},
				timeout: {
					connect: 1000,
					read: 1000
				}
			});
			var result = response();
			var latest = result.stream.character().asString();
			return latest;
		})();
		jsh.shell.console("Latest version: [" + latestVersion + "]");

		//	TODO	this will use cached chromedriver_mac64.zip, I think, and should not
		jsh.tools.install.install({
			url: "https://chromedriver.storage.googleapis.com/" + latestVersion + "/" + "chromedriver_mac64.zip",
			getDestinationPath: function(file) {
				return "";
			},
			to: jsh.shell.jsh.lib.getRelativePath("selenium/chrome")
		});
	}
//@ts-ignore
)(jsh);
