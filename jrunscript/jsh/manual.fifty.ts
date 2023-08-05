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
							var TMPDIR = $api.fp.world.now.question(
								jsh.file.Location.from.temporary(jsh.file.world.filesystems.os),
								{
									directory: true
								}
							);

							var isUnbuilt = function(p: slime.jsh.shell.Installation): p is slime.jsh.shell.UnbuiltInstallation {
								return p["src"];
							};

							var getBuildScript = jsh.file.Location.directory.relativePath("jrunscript/jsh/etc/build.jsh.js");

							var current = jsh.shell.jsh.Installation.from.current();
							if (isUnbuilt(current)) {
								var rhino: slime.$api.fp.Maybe<slime.jrunscript.file.Location> = $api.fp.now.invoke(
									current,
									$api.fp.property("src"),
									jsh.file.Location.from.os,
									jsh.file.Location.directory.relativePath("local/jsh/lib/js.jar"),
									function(location) {
										var exists = $api.fp.world.mapping(jsh.file.Location.file.exists())(location);
										return (exists) ? $api.fp.Maybe.from.some(location) : $api.fp.Maybe.from.nothing();
									}
								);

								var asJshIntention: slime.$api.fp.Identity<slime.jsh.shell.Intention> = $api.fp.identity;

								$api.fp.now.invoke(
									asJshIntention({
										shell: {
											src: current.src
										},
										script: getBuildScript(jsh.file.Location.from.os(current.src)).pathname,
										arguments: $api.Array.build(function(rv) {
											rv.push(TMPDIR.pathname);
											rv.push("-notest");
											rv.push("-nodoc");
											if (rhino.present) rv.push("-rhino", rhino.value.pathname);
										}),
										stdio: {
											output: "line",
											error: "line"
										}
									}),
									jsh.shell.jsh.Intention.toShellIntention,
									$api.fp.world.output(
										jsh.shell.subprocess.action,
										{
											stdout: function(e) {
												jsh.shell.console("jsh build STDOUT: " + e.detail.line);
											},
											stderr: function(e) {
												jsh.shell.console("jsh build STDERR: " + e.detail.line);
											}
										}
									)
								);

								jsh.shell.console("Build to " + TMPDIR.pathname);
								jsh.shell.console("arguments = [" + p.arguments.join(" ") + "]");

								var exit = $api.fp.now.invoke(
									asJshIntention({
										shell: {
											home: TMPDIR.pathname
										},
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
							} else {
								jsh.shell.console("Only unbuilt shells can be built.");
								jsh.shell.exit(1);
							}
						}
					}
				}
			})
		)
	}
//@ts-ignore
)($api,jsh);
