//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var operation = jsh.script.arguments[0];

		var input = {};
		jsh.shell.stdio.input.character().readLines(function(line) {
			var tokens = line.split("=");
			if (tokens.length >= 2) {
				input[tokens[0]] = tokens.slice(1).join("=");
				if (jsh.shell.environment.GIT_DEBUG) {
					jsh.shell.console(tokens[0] + "=" + input[tokens[0]]);
				}
			}
		});

		if (operation == "get") {
			jsh.shell.console("Displaying GUI dialog to get git credentials ...");
			if (!input.user) {
				input.username = jsh.ui.askpass.gui({
					nomask: true,
					prompt: "Enter username for " + input.host
				});
			}
			input.password = jsh.ui.askpass.gui({
				prompt: "Enter password for " + input.username + "@" + input.host
			});
			(function() {
				for (var x in input) {
					if (jsh.shell.environment.GIT_DEBUG) {
						jsh.shell.console(x + "=" + input[x]);
					}
					jsh.shell.echo(x + "=" + input[x]);
				}
			})();
			jsh.shell.echo();
			jsh.shell.console("Obtained git credentials.");
		}
		//	For other operations, we ignore them, as we have no storage for this helper
	}
)();
