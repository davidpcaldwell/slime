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
	 * @param { slime.jsh.plugin.Scope["$loader"] } $loader
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function($api,jsh,$loader,plugin) {
		$loader.plugin("install/");

		plugin({
			isReady: function() {
				return Boolean(jsh.internal && jsh.internal.bootstrap && jsh.shell && jsh.shell.jsh);
			},
			load: function() {
				/** @type { { $api: typeof jsh.internal.bootstrap } } */
				var jrunscript = {
					$api: jsh.internal.bootstrap
				};

				var console = jrunscript.$api.console;

				jsh.shell.jsh.tools = {
					copyLauncherScripts: function(SLIME,destination) {
						console("Copying launcher scripts ...");
						SLIME.getFile("rhino/jrunscript/api.js").copy(destination.shell.getRelativePath("jsh.js"));
						["slime.js","javac.js","launcher.js","main.js"].forEach(function(name) {
							SLIME.getFile("jrunscript/jsh/launcher/" + name).copy(destination.shell);
						});
					}
				}
			}
		})
	}
//@ts-ignore
)($api,jsh,$loader,plugin);
