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
		var asJshIntention: slime.$api.fp.Identity<slime.jsh.shell.Intention> = $api.fp.identity;

		var fixtures = (function() {
			var script: slime.jrunscript.jsh.test.Script = jsh.script.loader.script("fixtures.ts");
			return script();
		})();

		jsh.script.cli.main(
			jsh.script.cli.program({
				commands: {
					run: {
						built: function(p) {
							var shell = fixtures.shells.built();

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
						},
						packaged: function(p) {
							var jar = fixtures.shells.packaged();

							var exit = $api.fp.now.invoke(
								//	TODO	what about VM invocation stuff
								//	TODO	test arguments, properties, environment perhaps
								asJshIntention({
									package: jar,
									stdio: {
										output: "line",
										error: "line"
									}
								}),
								jsh.shell.jsh.Intention.toShellIntention,
								$api.fp.world.mapping(
									jsh.shell.subprocess.question,
									{
										stdout: jsh.shell.Invocation.handler.stdio.line(function(e) {
											jsh.shell.console(jar + " OUTPUT: " + e.detail.line);
										}),
										stderr: jsh.shell.Invocation.handler.stdio.line(function(e) {
											jsh.shell.console(jar + " CONSOLE: " + e.detail.line);
										})
									}
								)
							);

							return exit.status;
						}
					}
				}
			})
		)
	}
//@ts-ignore
)($api,jsh);
