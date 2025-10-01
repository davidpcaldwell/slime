//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		//	#1961: convert to automated test after development?
		jsh.script.cli.main(function() {
			jsh.shell.console("Hello, World!");

			jsh.shell.console("keys = " + Object.keys(jsh.internal.bootstrap).join(" "));
			//	#1961
			//jsh.shell.console(String(jsh.internal.bootstrap.jsh));
		})
	}
//@ts-ignore
)($api,jsh);
