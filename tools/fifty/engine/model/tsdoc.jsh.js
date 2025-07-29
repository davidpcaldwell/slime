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
	 */
	function($api,jsh) {
		var parameters = jsh.script.getopts({
			options: {
				"node:debug": false,
				file: jsh.file.Pathname,
				ast: jsh.file.Pathname,
				to: jsh.file.Pathname
			}
		})

		$api.fp.world.execute(jsh.shell.tools.node.require.action);
		jsh.shell.tools.node.installed.modules.require({ name: "typescript" });
		jsh.shell.tools.node.installed.modules.require({ name: "@microsoft/tsdoc" });

		/** @type { slime.fifty.ui.Exports } */
		var module = jsh.script.loader.module("module.js", {
			library: {
				node: jsh.shell.tools.node
			}
		});

		var ast = module.ast({
			node: {
				script: jsh.script.file.parent.getRelativePath("tsdoc.node.js"),
				debug: parameters.options["node:debug"]
			},
			ast: parameters.options.ast,
			file: parameters.options.file
		});

		var documentation = module.interpret({
			ast: ast
		});

		parameters.options.to.write(JSON.stringify(documentation, void(0), "    "), { append: false });
	}
//@ts-ignore
)($api,jsh)
