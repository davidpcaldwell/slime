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
	 * @param { slime.jsh.plugin.Scope["plugins"] } plugins
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function($api,jsh,plugins,$loader,plugin) {
		plugin({
			load: function() {
				/** @type { slime.jrunscript.bootstrap.Script } */
				var jrunscriptBootstrap = $loader.script("embed.js");
				var jrunscriptBootstrapApis = jrunscriptBootstrap({
					debug: false,
					script: {}
				});
				plugins.launcher = jrunscriptBootstrapApis;
			}
		})
	}
//@ts-ignore
)($api,jsh,plugins,$loader,plugin);
