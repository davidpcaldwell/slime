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
				return Boolean(jsh.file && jsh.shell && jsh.tools && jsh.tools.git && jsh.tools.code);
			},
			load: function() {
				if (!jsh.project) jsh.project = {
					code: void(0),
					openapi: void(0),
					dependencies: void(0)
				};

				var code = {
					/** @type { slime.project.code.Script } */
					code: $loader.script("module.js"),
					/** @type { slime.project.openapi.Script } */
					openapi: $loader.script("openapi-update.js")
				};

				jsh.project.code = code.code({
					library: {
						file: jsh.file,
						io: jsh.io,
						git: jsh.tools.git,
						code: jsh.tools.code
					}
				});

				var openapi = (
					function() {
						return code.openapi({
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
