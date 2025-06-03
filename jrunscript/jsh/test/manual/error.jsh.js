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
		jsh.script.cli.main(function() {
			try {
				throw new Packages.java.lang.AssertionError("no");
			} catch (e) {
				jsh.shell.console("Caught");
			}
		})
	}
//@ts-ignore
)(Packages,$api,jsh);
