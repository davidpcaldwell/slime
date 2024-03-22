//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jsh.plugin.plugins } plugins
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(plugins,$loader,plugin) {
		plugin({
			isReady: function() {
				return true;
			},
			load: function() {
				plugins.node = {
					module: function(p) {
						/** @type { slime.jrunscript.tools.node.Script } */
						var script = $loader.script("module.js");
						return script(p.context);
					}
				};
			}
		});
	}
//@ts-ignore
)(plugins,$loader,plugin);
