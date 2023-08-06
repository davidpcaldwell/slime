//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	(
		$api: slime.$api.Global,
		jsh: slime.jsh.Global
	) => {
		jsh.script.cli.main(
			jsh.script.cli.program({
				commands: {
					run: {
						built: function(p) {
							var fixtures = (function() {
								var script: slime.jrunscript.jsh.test.Script = jsh.script.loader.script("fixtures.ts");
								return script();
							})();

							var shell = fixtures.shells.built();

							jsh.shell.console("Build to " + shell.home);
							jsh.shell.console("arguments = [" + p.arguments.join(" ") + "]");

							var asJshIntention: slime.$api.fp.Identity<slime.jsh.shell.Intention> = $api.fp.identity;

							var exit = $api.fp.now.invoke(
								asJshIntention({
									shell: shell,
									script: p.arguments[0],
									arguments: p.arguments.slice(1),
									stdio: {
										output: "line",
										error: "line"
									}
								}),
								jsh.shell.jsh.Intention.toShellIntention,
								$api.fp.world.mapping(
									jsh.shell.subprocess.question,
									{
										stdout: function(e) {
											jsh.shell.console("BUILT SHELL OUTPUT: " + e.detail.line);
										},
										stderr: function(e) {
											jsh.shell.console("BUILT SHELL CONSOLE: " + e.detail.line);
										}
									}
								)
							);

							jsh.shell.exit(exit.status);
						}
					}
				}
			})
		)
	}
//@ts-ignore
)($api,jsh);
