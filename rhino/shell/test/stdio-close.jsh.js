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
	 * @param { slime.jsh.script.cli.main } main
	 */
	function($api,jsh,main) {
		main(function() {
			jsh.shell.console("Hello, World!");
			if (jsh.shell.stdio.error["close"]) jsh.shell.stdio.error["close"]();
			jsh.shell.console("Hello, again!");
			jsh.shell.echo(
				JSON.stringify({
					stderr: {
						close: Boolean(jsh.shell.stdio.error["close"])
					}
				})
			)
		})
	}
//@ts-ignore
)($api,jsh,main);
