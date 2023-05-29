//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { object } global
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(global,plugin) {
		plugin({
			load: function() {
				global.scope = {
					//@ts-ignore
					$host: typeof($host)
				}
			}
		})
	}
//@ts-ignore
)(global,plugin)
