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
	 */
	function($api,jsh) {
		(
			$api.Function.pipe(
				jsh.script.cli.option.pathname({ longname: "definition" }),
				function run(p) {
					var suite = new jsh.unit.html.Suite();

					suite.add("jrunscript", jsh.unit.Suite.Fork({
						run: jsh.shell.jsh,
						shell: jsh.shell.jsh.src,
						script: jsh.shell.jsh.src.getRelativePath("jsh/test/suite.jsh.js"),
						arguments: ["-definition", p.options.definition, "-view", "stdio"]
					}));

					suite.add("browser", jsh.unit.Suite.Fork({
						run: jsh.shell.jsh,
						shell: jsh.shell.jsh.src,
						script: jsh.shell.jsh.src.getRelativePath("loader/browser/test/suite.jsh.js"),
						arguments: ["-definition", p.options.definition, "-view", "stdio"]
					}))

					jsh.unit.interface.create(suite.build(), {
						view: "console"
					});
				}
			)
		)({
			options: {},
			arguments: jsh.script.arguments.slice()
		})

	}
//@ts-ignore
)($api,jsh);
