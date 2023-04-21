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
	 * @param { slime.jsh.plugin.Scope["$loader"] } $loader
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function(jsh,$loader,plugin) {
		/** @type { slime.jrunscript.tools.gcloud.Script } */
		var code = $loader.script("module.js");
		plugin({
			isReady: function() {
				return Boolean(jsh.file && jsh.shell && jsh.tools.install);
			},
			load: function() {
				jsh.tools.gcloud = code({
					library: {
						file: jsh.file,
						shell: jsh.shell,
						install: jsh.tools.install
					}
				})
			}
		})
	}
//@ts-ignore
)(jsh,$loader,plugin);
