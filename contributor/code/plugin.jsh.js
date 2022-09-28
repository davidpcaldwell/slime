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
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($api,jsh,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.file && jsh.shell && jsh.tools && jsh.tools.code);
			},
			load: function() {
				if (!jsh.project) jsh.project = {
					code: void(0),
					openapi: void(0)
				};
				/** @type { slime.project.code.Script } */
				var script = $loader.script("module.js");
				jsh.project.code = script({
					library: {
						file: jsh.file,
						io: jsh.io,
						code: jsh.tools.code
					}
				});

				var openapi = (
					function() {
						/** @type { slime.project.openapi.Script } */
						var script = $loader.script("openapi-update.js");
						return script({
							library: {
								shell: jsh.shell
							}
						})
					}
				)();

				jsh.project.openapi = {
					generate: function(p) {
						var configuration = openapi.initialize(jsh);
						openapi.generate(
							$api.Object.compose(
								{ configuration: configuration },
								p
							)
						)
						jsh.shell.console("Wrote TypeScript definition to " + p.destination);
					}
				}
			}
		})
	}
//@ts-ignore
)($api,jsh,$loader,plugin);
