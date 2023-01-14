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
		jsh.loader.plugins(jsh.script.loader.Child("plugin-scope/"));

		jsh.script.cli.main(
			function() {
				jsh.shell.echo(JSON.stringify(
					(function() { return this; })().scope
				))
			}
		)
	}
//@ts-ignore
)($api,jsh,main);
