//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var operation = jsh.script.arguments[0];

var input = {};
jsh.shell.stdio.input.character().readLines(function(line) {
	var tokens = line.split("=");
	if (tokens.length >= 2) {
		input[tokens[0]] = tokens.slice(1).join("=");
		if (jsh.shell.environment.GIT_DEBUG) {
			jsh.shell.echo(tokens[0] + "=" + input[tokens[0]], { stream: jsh.shell.stdio.error });
		}
	}
});

if (operation == "get") {
	jsh.shell.console("Displaying GUI dialog to get git credentials ...");
	if (!input.user) {
		input.username = jsh.java.tools.askpass.gui({
			nomask: true,
			prompt: "Enter username for " + input.host
		});
	}
	input.password = jsh.java.tools.askpass.gui({
		prompt: "Enter password for " + input.username + "@" + input.host
	});
	for (var x in input) {
		if (jsh.shell.environment.GIT_DEBUG) {
			jsh.shell.echo(x + "=" + input[x], { stream: jsh.shell.stdio.error });
		}
		jsh.shell.echo(x + "=" + input[x]);
	}
	jsh.shell.echo();
	jsh.shell.console("Obtained git credentials.");
}
//	For other operations, we ignore them, as we have no storage for this helper
