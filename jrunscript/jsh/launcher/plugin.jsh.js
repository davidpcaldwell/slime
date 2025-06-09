//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.Scope["plugins"] } plugins
	 * @param { slime.runtime.loader.Store } $loader
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function(Packages,$api,jsh,plugins,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(plugins.launcher);
			},
			load: function() {
				var target = {
					$api: plugins.launcher,
					Packages: Packages,
					embed: true
				};

				//	#1961: enable
				//$loader.run("main.js", {}, target);

				jsh.internal = {
					bootstrap: target.$api
				};
			}
		})
	}
//@ts-ignore
)(Packages,$api,jsh,plugins,$loader,plugin);
