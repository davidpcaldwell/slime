//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * Program that allows testing various ways of launching `jsh` subshells.
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var src = jsh.shell.jsh.src.toString();

		var at = jsh.file.Location.base(
			jsh.file.Location.from.os(
				jsh.shell.jsh.src.toString()
			)
		);

		var script = at("jrunscript/jsh/test/jsh-data.jsh.js");

		jsh.script.cli.main(
			jsh.script.cli.program({
				commands: {
					world: function() {
						var subshell = jsh.shell.Intention.from.jsh({
							shell: {
								src: src
							},
							script: script.pathname
						});
						var result = $api.fp.world.now.question(
							jsh.shell.subprocess.question,
							subshell
						);
						jsh.shell.exit(result.status);
					},
					oo: function() {
						var result = jsh.shell.jsh({
							fork: true,
							script: jsh.file.Pathname(script.pathname).file
						});
						jsh.shell.exit(result.status);
					}
				}
			})
		)
	}
//@ts-ignore
)($api,jsh,main);
