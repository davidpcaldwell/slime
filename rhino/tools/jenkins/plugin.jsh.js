//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { { jenkins: slime.jrunscript.tools.jenkins.Exports } } global
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(global, $api, jsh, $loader, plugin) {
		plugin({
			load: function() {
				/** @type { slime.jrunscript.tools.jenkins.Script } */
				var script = $loader.script("module.js");

				var jenkins = script({
					library: {
						io: jsh.io,
						http: jsh.http,
						document: jsh.document
					}
				});

				jsh.tools.jenkins = jenkins;

				global.jenkins = jenkins;
				$api.deprecate(global, "jenkins");
			}
		});
	}
//@ts-ignore
)( global, $api, jsh, $loader, plugin );
