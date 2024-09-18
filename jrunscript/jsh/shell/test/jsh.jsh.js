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
			function() {
				jsh.shell.echo(
					JSON.stringify({
						arguments: jsh.script.arguments,
						environment: jsh.shell.environment,
						directory: jsh.shell.PWD.pathname.toString(),
						properties: jsh.shell.properties.object
					})
				);
			}
		)
	}
//@ts-ignore
)($api,jsh);
