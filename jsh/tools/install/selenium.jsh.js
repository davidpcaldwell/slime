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
				url: "https://github.com/SeleniumHQ/selenium/releases/download/selenium-4.1.0/selenium-java-4.1.2.zip",
				replace: false
			}
		});

		var library = jsh.shell.jsh.lib.getRelativePath("selenium/java");

		if (parameters.options.replace) {
			if (library.directory) {
				library.directory.remove();
			}
		}

		if (!library.directory) {
			jsh.tools.install.install({
				url: parameters.options.url,
				getDestinationPath: function(file) { return ""; },
				to: library
			});
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.browser.object.Chrome } chrome
		 */
		var getMajorVersion = function(chrome) {
			return jsh.shell.browser.Chrome.getMajorVersion(chrome)
		}

		/**
		 *
		 * @param { number } majorVersion
		 */
		var getLatestVersion = function(majorVersion) {
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
		}

		var majorVersion = getMajorVersion(jsh.shell.browser.chrome);
		jsh.shell.console("Chrome major version: " + majorVersion);

		var latestVersion = getLatestVersion(majorVersion);
		jsh.shell.console("Latest version: [" + latestVersion + "]");

		//	TODO	jsh.tools.install.install uses cached downloads by default; find a better way to do this rather than just
		//			deleting to bust cache
		if (jsh.shell.HOME.getFile("Downloads/chromedriver_mac64.zip")) {
			jsh.shell.HOME.getFile("Downloads/chromedriver_mac64.zip").remove();
		}

		var seleniumChrome = jsh.shell.jsh.lib.getRelativePath("selenium/chrome");

		if (seleniumChrome.directory) seleniumChrome.directory.remove();

		jsh.tools.install.install({
			url: "https://chromedriver.storage.googleapis.com/" + latestVersion + "/" + "chromedriver_mac64.zip",
			getDestinationPath: function(file) {
				return "";
			},
			to: seleniumChrome
		});
	}
//@ts-ignore
)(jsh);
