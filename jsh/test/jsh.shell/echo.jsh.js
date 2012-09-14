//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

jsh.shell.echo(true);

var console = new function() {
	var lines = [];

	this.echo = function(s) {
		lines.push(s);
	}

	this.getLines = function() {
		return lines;
	}
}

jsh.shell.echo("A", { console: console.echo });
jsh.shell.echo("B", { console: console.echo });

var lines = console.getLines();
if (lines.length != 2) {
	jsh.shell.exit(1);
}
if (lines[0] != "A" || lines[1] != "B") {
	jsh.shell.exit(1);
}

