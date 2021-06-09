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
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($api,jsh,$slime,$loader,plugin) {
		plugin({
			load: function() {
				Object.defineProperty(
					jsh,
					"java",
					{
						get: $api.Function.memoized(function() {
							return $loader.module("module.js", {
								globals: true,
								$slime: $slime,
								logging: {
									prefix: "inonit.script.jsh.Shell.log"
								}
							});
						}),
						enumerable: true
					}
				);
			}
		})
	}
//@ts-ignore
)($api,jsh,$slime,$loader,plugin);

