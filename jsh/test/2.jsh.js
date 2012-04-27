//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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
			jsh.shell.echo("Failure in jsh.shell.jsh!");
			jsh.shell.exit(result.status);
		}
	}
});
jsh.shell.echo("Success!");
jsh.shell.exit(0);