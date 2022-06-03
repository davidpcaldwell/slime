//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		if (!jsh.shell.tools.node["version"]) {
			jsh.shell.console("Node not installed.");
			jsh.shell.exit(1);
		}

		$api.Function.result(
			jsh.shell.tools.node.installed.modules.installed,
			Object.entries,
			function(entries) {
				entries.forEach(function(item) {
					jsh.shell.console(item[0] + ": " + item[1].version)
				})
			}
		)
	}
//@ts-ignore
)($api,jsh)
