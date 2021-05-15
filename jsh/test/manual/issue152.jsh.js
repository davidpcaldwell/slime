//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.shell.stderr.character().write("Type one line of text, which should be echoed and then the program should exit.\n");
var line = jsh.shell.stdin.character().readLines(function(line) {
	return line;
});
jsh.shell.echo("typed line [" + line + "]; should now exit.");

