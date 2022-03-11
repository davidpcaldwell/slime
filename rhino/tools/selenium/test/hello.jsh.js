//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		/** @type { slime.js.Cast<slime.jrunscript.Packages["org"] & { openqa: any }> } */
		var cast = function(org) {
			return org;
		}
		/** @type { slime.jrunscript.Packages["org"] & { openqa: any }} */
		var org = cast(Packages.org);
		Packages.java.lang.System.setProperty("webdriver.chrome.driver",jsh.shell.jsh.lib.getRelativePath("selenium/chrome/chromedriver").toString());
		jsh.shell.jsh.lib.getSubdirectory("selenium/java/lib").list().forEach(function(node) {
			//jsh.shell.console("node = " + node);
			jsh.loader.java.add(node.pathname);
		})
		jsh.shell.jsh.lib.getSubdirectory("selenium/java").list().forEach(function(node) {
			//jsh.shell.console("node = " + node);
			jsh.loader.java.add(node.pathname);
		})
		var _options = new org.openqa.selenium.chrome.ChromeOptions();
		var _driver = new org.openqa.selenium.chrome.ChromeDriver(_options);
		_driver.quit();
		jsh.shell.console("Done.");
	}
//@ts-ignore
)(Packages,$api,jsh);
