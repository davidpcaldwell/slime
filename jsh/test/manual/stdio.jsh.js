//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

jsh.shell.stderr.character().write("Verify that the text 'stdout' shows up before typing anything:\n");
//	TODO	it does not, at least in my setup, which is a bug, but it is unclear exactly what is causing it
//	TODO	currently does not work on Windows or FreeBSD
jsh.shell.stdout.character().write("stdout: ");
jsh.shell.stdin.character().readLines(function(line) {
	jsh.shell.echo("Line: [" + line + "]");
});
