//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		//	TODO	is there a way to get Java properties through jsh.java or jsh.shell?
		jsh.shell.console("tmpdir = " + Packages.java.lang.System.getProperty("java.io.tmpdir"));
	}
//@ts-ignore
)(Packages,$api,jsh);
