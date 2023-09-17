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
		var operation = jsh.script.arguments[0];

		/** @type { { host: string, password: string, username: string } } */
		var input = {
			host: void(0),
			password: void(0),
			username: void(0)
		};
		jsh.shell.stdio.input.character().readLines(function(line) {
			var tokens = line.split("=");
			if (tokens.length >= 2) {
				input[tokens[0]] = tokens.slice(1).join("=");
				if (jsh.shell.environment.GIT_DEBUG) {
					jsh.shell.echo(tokens[0] + "=" + input[tokens[0]], { stream: jsh.shell.stdio.error });
				}
			}
		});

		var tokens = jsh.shell.PWD.getRelativePath("local/github/tokens");

		if (jsh.shell.environment.GIT_DEBUG) jsh.shell.console("input: " + JSON.stringify(input));

		if (operation == "get" && input.host == "github.com") {
			var output = $api.Object.compose(input);
			if (tokens.directory && tokens.directory.getFile(input.username)) {
				var token = tokens.directory.getFile(input.username).read(String);
				output.password = token;
				jsh.shell.console("Obtained GitHub token for " + input.username + ".");
			}
			(function() {
				for (var x in output) {
					if (jsh.shell.environment.GIT_DEBUG) {
						jsh.shell.echo(x + "=" + output[x], { stream: jsh.shell.stdio.error });
					}
					jsh.shell.echo(x + "=" + output[x]);
				}
			})();
			jsh.shell.echo("");
		}

		//	For other operations, we ignore them, as we have no storage for this helper
	}
//@ts-ignore
)($api,jsh);
