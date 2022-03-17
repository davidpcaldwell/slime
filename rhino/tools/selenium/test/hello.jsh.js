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
		jsh.shell.tools.selenium.load();
		var _options = new Packages.org.openqa.selenium.chrome.ChromeOptions();
		var _driver = new Packages.org.openqa.selenium.chrome.ChromeDriver(_options);
		_driver.quit();
		jsh.shell.console("Done.");
	}
//@ts-ignore
)(Packages,$api,jsh);
