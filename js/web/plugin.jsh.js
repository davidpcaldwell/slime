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
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($api,jsh,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.js);
			},
			load: function() {
				var web = $loader.module("module.js", $loader.file("context.java.js"));
				jsh.js.web = web;
				$api.deprecate(jsh.js, "web");
				jsh.web = web;
			}
		});
	}
//@ts-ignore
)($api,jsh,$loader,plugin);
