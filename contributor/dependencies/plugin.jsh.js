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
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function($api,jsh,$loader,plugin) {
		plugin({
			isReady: function() { return Boolean(jsh.file); },
			load: function() {
				if (!jsh.project) {
					jsh.project = {
						code: void(0),
						openapi: void(0),
						dependencies: void(0)
					};
				}
				/** @type { slime.project.dependencies.Script } */
				var code = $loader.script("module.js");
				jsh.project.dependencies = code({
					library: {
						file: jsh.file
					}
				})
			}
		});
	}
//@ts-ignore
)($api,jsh,$loader,plugin);
