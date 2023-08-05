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
		jsh.script.cli.main(
			jsh.script.cli.program({
				commands: {
					build: $api.fp.pipe(
						jsh.script.cli.option.pathname({ longname: "destination" }),
						jsh.script.cli.option.pathname({ longname: "rhino" }),
						function(p) {
							/** @type { (p: slime.jsh.shell.Installation) => p is slime.jsh.shell.UnbuiltInstallation } */
							var isUnbuilt = function(p) {
								return p["src"];
							};

							var getBuildScript = jsh.file.Location.directory.relativePath("jrunscript/jsh/etc/build.jsh.js");

							var current = jsh.shell.jsh.Installation.from.current();
							if (isUnbuilt(current)) {
								/** @type { slime.$api.fp.Identity<slime.jsh.shell.Intention> } */
								var asJshIntention = $api.fp.identity;

								$api.fp.now.invoke(
									asJshIntention({
										shell: {
											src: current.src
										},
										script: getBuildScript(jsh.file.Location.from.os(current.src)).pathname,
										arguments: $api.Array.build(function(rv) {
											rv.push(p.options.destination.toString());
											rv.push("-notest");
											rv.push("-nodoc");
											if (p.options.rhino) rv.push("-rhino", p.options.rhino.toString());

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
								)
							} else {
								jsh.shell.console("Only unbuilt shells can be built.");
								jsh.shell.exit(1);
							}
						}
					)
				}
			})
		)
	}
//@ts-ignore
)($api,jsh);
