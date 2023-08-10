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
							var to = $api.fp.world.now.question(
								jsh.file.Location.from.temporary(jsh.file.world.filesystems.os),
								{
									directory: false,
									suffix: ".jar"
								}
							);

							var at = $api.fp.now.invoke(
								fixtures.shells.unbuilt(),
								$api.fp.property("src"),
								jsh.file.Location.from.os,
								jsh.file.Location.directory.base,
								function(base) {
									return function(path: string) {
										return base(path).pathname;
									}
								}
							);

							var build = $api.fp.now.invoke(
								asJshIntention({
									shell: fixtures.shells.unbuilt(),
									script: at("jrunscript/jsh/tools/shell.jsh.js"),
									arguments: $api.Array.build(function(rv) {
										rv.push("package");
										rv.push("--script", at("jrunscript/jsh/test/jsh-data.jsh.js")),
										rv.push("--to", to.pathname);
									}),
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
											jsh.shell.console("package.jsh.js OUTPUT: " + e.detail.line);
										},
										stderr: function(e) {
											jsh.shell.console("package.jsh.js CONSOLE: " + e.detail.line);
										}
									}
								)
							);

							if (build.status != 0) throw new Error("package.jsh.js exit status: " + build.status);

							var exit = $api.fp.now.invoke(
								//	TODO	what about VM invocation stuff
								//	TODO	test arguments, properties, environment perhaps
								asJshIntention({
									package: to.pathname,
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
											jsh.shell.console(to.pathname + " OUTPUT: " + e.detail.line);
										}),
										stderr: jsh.shell.Invocation.handler.stdio.line(function(e) {
											jsh.shell.console(to.pathname + " CONSOLE: " + e.detail.line);
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
