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
		jsh.shell.console("foo.bar = " + JSON.stringify(String(Packages.java.lang.System.getProperty("foo.bar"))));
		jsh.shell.console("foo.baz = " + JSON.stringify(String(Packages.java.lang.System.getProperty("foo.baz"))));
		jsh.shell.console("foo.bizzy = " + JSON.stringify(String(Packages.java.lang.System.getProperty("foo.bizzy"))));
	}
//@ts-ignore
)(Packages,$api,jsh);
