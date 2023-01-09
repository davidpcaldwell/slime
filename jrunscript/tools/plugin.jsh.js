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
	 * @param { slime.jsh.plugin.plugin } plugin
	 * @param { slime.jsh.plugin.plugins } plugins
	 * @param { slime.old.Loader } $loader
	 */
	function(jsh,plugin,plugins,$loader) {
		plugin({
			isReady: function() {
				//	TODO	duplicates install/plugin.jsh.js
				return Boolean(jsh.js && jsh.web && jsh.java && jsh.ip && jsh.time && jsh.file && jsh.http && jsh.shell && jsh.java.tools);
			},
			load: function() {
				jsh.loader.plugins($loader.Child("install/"));
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.file && jsh.shell);
			},
			load: function() {
				/** @type { slime.jrunscript.tools.scala.Script } */
				var script = $loader.script("scala.js");
				plugins.scala = script({
					library: {
						file: jsh.file,
						shell: jsh.shell
					}
				});
			}
		})
	}
//@ts-ignore
)(jsh,plugin,plugins,$loader)
