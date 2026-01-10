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
	function($api,jsh) {
		var parameters = jsh.script.getopts({
			options: {
				replace: false
			}
		});
		$api.fp.world.Means.now({
			means: jsh.shell.tools.kotlin.install,
			order: parameters.options,
			handlers: {
				console: function(e) {
					jsh.shell.console(e.detail);
				}
			}
		});
	}
//@ts-ignore
)($api,jsh);
