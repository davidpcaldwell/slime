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
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(jsh,$slime,plugin) {
		plugin({
			load: function() {
				jsh.$fifty = {
					plugin: {
						mock: function(p) {
							return $slime.plugins.mock(p);
						}
					},
					browser: void(0)
				};
			}
		})
	}
//@ts-ignore
)(jsh,$slime,plugin);
