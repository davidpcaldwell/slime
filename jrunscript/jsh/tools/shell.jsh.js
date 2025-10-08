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
		/** @type { slime.$api.fp.Identity<slime.jsh.shell.Intention> } */
		var asJshIntention = $api.fp.identity;

		/** @type { slime.$api.fp.Identity<slime.jsh.shell.UnbuiltInstallation> } */
		var asUnbuiltInstallation = $api.fp.identity;

		/**
		 *
		 * @param { slime.jsh.shell.UnbuiltInstallation } unbuilt
		 * @returns
		 */
		var getScript = $api.fp.pipe(
			asUnbuiltInstallation,
			$api.fp.property("src"),
			jsh.file.Location.from.os,
			jsh.file.Location.directory.base,
			//	TODO	what is this pattern and can we simplify it
			function(f) {
				/**
				 * @param { string } path
				 */
				return function(path) {
					return f(path).pathname;
				}
			}
		);

		jsh.script.cli.main(
			jsh.script.cli.program({
				commands: {
					build: $api.fp.pipe(
						jsh.script.cli.option.pathname({ longname: "destination" }),
						jsh.script.cli.option.array({
							longname: "engine",
							value: $api.fp.identity
						}),
						jsh.script.cli.option.boolean({ longname: "executable" }),
						function(p) {
							var current = jsh.shell.jsh.Installation.from.current();
							if (jsh.shell.jsh.Installation.is.unbuilt(current)) {
								var buildScript = getScript(current)("jrunscript/jsh/etc/build.jsh.js");

								$api.fp.now.invoke(
									asJshIntention({
										shell: current,
										script: buildScript,
										arguments: $api.Array.build(function(rv) {
											rv.push(p.options.destination.toString());
											rv.push("-norhino");
											p.options.engine.forEach(function(engine) {
												rv.push("-engine", engine);
											});
											if (p.options.executable) rv.push("-executable");
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
					),
					package: $api.fp.pipe(
						jsh.script.cli.option.pathname({ longname: "script" }),
						jsh.script.cli.option.pathname({ longname: "to" }),
						function(p) {
							var current = jsh.shell.jsh.Installation.from.current();
							if (!jsh.shell.jsh.Installation.is.unbuilt(current)) {
								jsh.shell.console("Only an unbuilt shell can be used to create a packaged script.");
								jsh.shell.exit(1);
							}

							$api.fp.now.invoke(
								asJshIntention({
									shell: current,
									script: getScript(current)("jrunscript/jsh/tools/package.jsh.js"),
									arguments: $api.Array.build(function(rv) {
										rv.push("-script", p.options.script.toString());
										rv.push("-to", p.options.to.toString());
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
											jsh.shell.console("jsh package STDOUT: " + e.detail.line);
										},
										stderr: function(e) {
											jsh.shell.console("jsh package STDERR: " + e.detail.line);
										}
									}
								)
							);
						}
					)
				}
			})
		)
	}
//@ts-ignore
)($api,jsh);
