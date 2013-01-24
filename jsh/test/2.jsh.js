//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2011-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var file = jsh.loader.file(jsh.script.getRelativePath("2.js"));

if (typeof(file.x) != "undefined") jsh.shell.exit(1);
if (file.y != 3) jsh.shell.exit(1);

var buffer = new jsh.io.Buffer();

jsh.shell.jsh(jsh.script.getRelativePath("1.jsh"), [], {
	stdout: buffer,
	stderr: buffer,
	onExit: function(result) {
		buffer.close();
		jsh.shell.echo("output = " + buffer.readText().asString());
		if (result.status != 0) {
			jsh.shell.echo("Failure in jsh.shell.jsh! (exit status: " + result.status + ")");
			jsh.shell.exit(result.status);
		}
	}
});
jsh.shell.echo("Success!");
jsh.shell.exit(0);