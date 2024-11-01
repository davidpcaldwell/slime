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
				project: jsh.shell.jsh.src.pathname
			}
		});

		$api.fp.world.execute(jsh.shell.tools.node.require.action);
		$api.fp.world.Action.now({
			action: jsh.shell.tools.node.Installation.modules(jsh.shell.tools.node.installation).require({ name: "eslint", version: "9.13.0" }),
		});

		jsh.shell.tools.node.installed.run({
			command: "eslint",
			arguments: [/*"--debug",*/ "."],
			directory: parameters.options.project.directory,
			evaluate: function(result) {
				jsh.shell.exit(result.status);
			}
		});
	}
//@ts-ignore
)($api,jsh);
