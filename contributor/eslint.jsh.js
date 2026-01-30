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
		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.pathname({ longname: "project", default: jsh.shell.PWD.pathname }),
				function(p) {
					jsh.shell.console("Project: " + p.options.project.toString());
					var modules = jsh.shell.tools.node.Project.modules({ base: p.options.project.toString() })(jsh.shell.tools.node.installation);

					jsh.shell.tools.node.require.simple();

					$api.fp.world.Action.now({
						action: modules.require({ name: "eslint", version: "9.13.0" }),
						handlers: {
							found: function(e) {
								var found = e.detail;
								if (found.present) {
									jsh.shell.console("Found: ESLint " + JSON.stringify(found.value));
								} else {
									jsh.shell.console("ESLint not found.");
								}
							},
							installed: function(e) {
								jsh.shell.console("Installed.");
							},
							installing: function(e) {
								jsh.shell.console("Installing.");
							}
						}
					});

					$api.fp.world.Action.now({
						action: modules.require({ name: "@eslint/js" }),
					});

					var module = $api.fp.world.Question.now({
						question: modules.installed("eslint")
					});

					if (module.present) {
						jsh.shell.tools.node.installed.run({
							project: jsh.file.Pathname(module.value.path).parent.parent.directory,
							command: "eslint",
							arguments: [/*"--debug",*/ "."],
							directory: p.options.project.directory,
							evaluate: function(result) {
								jsh.shell.exit(result.status);
							}
						});
					} else {
						jsh.shell.console("eslint not found.");
						jsh.shell.exit(1);
					}
				}
			)
		);
	}
//@ts-ignore
)($api,jsh);
