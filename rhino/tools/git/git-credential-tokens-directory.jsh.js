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
		var loader = jsh.script.loader;

		/** @type { slime.jrunscript.tools.github.credentials.Script } */
		var script = loader.script("git-credential-tokens-directory.js");

		var api = script({
			library: {
				file: jsh.file
			}
		});

		api.helper({
			operation: jsh.script.arguments[0],
			project: {
				base: jsh.shell.PWD.pathname.os.adapt()
			},
			input: jsh.shell.stdio.input,
			output: jsh.shell.echo,
			console: jsh.shell.console,
			debug: (jsh.shell.environment.GIT_CREDENTIAL_DEBUG) ? jsh.shell.console : void(0)
		});
	}
//@ts-ignore
)($api,jsh);
