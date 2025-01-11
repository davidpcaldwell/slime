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
	 * @param { slime.project.openapi.Context } $context
	 * @param { slime.loader.Export<slime.project.openapi.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jrunscript.file.File } src
		 * @returns
		 */
		function sanitizeJson(src) {
			var config = $context.library.shell.TMPDIR.createTemporary({ suffix: ".json" });
			var value = eval("(" + src.read(String) + ")");
			config.pathname.write(JSON.stringify(value, void(0), 4), { append: false });
			return config.pathname.file;
		}

		$export({
			initialize: function(jsh) {
				$api.fp.world.execute(jsh.shell.tools.node.require.action);
				jsh.shell.tools.node.installed.modules.require({ name: "dtsgenerator", version: "3.19.2" });
				jsh.shell.tools.node.installed.modules.require({ name: "tslib", version: "2.8.1" });
				jsh.shell.tools.node.installed.modules.require({ name: "@dtsgenerator/replace-namespace", version: "1.7.0" });

				var node = jsh.shell.tools.node;

				return {
					src: jsh.shell.jsh.src,
					node: node.installed
				};
			},
			generate: function(p) {
				var config = sanitizeJson(p.config);
				p.configuration.node.run({
					command: "dtsgen",
					arguments: $api.Array.build(function(rv) {
						rv.push("--url", p.specification.url);
						rv.push("--config", config);
						rv.push("--out", p.destination);
					})
				});
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
