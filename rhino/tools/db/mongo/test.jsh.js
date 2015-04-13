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

jsh.loader.plugins(jsh.script.file.parent.pathname);

var MONGO = jsh.file.Pathname("/mindtap/mongo").directory;

var mongod = jsh.script.loader.file("mongod.js", {
	install: MONGO
});

var _socket = new Packages.java.net.ServerSocket(0);
var port = _socket.getLocalPort();
_socket.close();
jsh.shell.echo("port = " + port);
var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
var mongod = new mongod.Server({
	port: port,
	dbpath: TMP
});
jsh.shell.echo("Waiting 15s...");
try {
	Packages.java.lang.Thread.sleep(15000);
} catch (e) {
	jsh.shell.echo("Caught: " + e);
}
jsh.shell.echo("Killing mongod ...");
mongod.stop();
jsh.shell.echo("Killed.");
debugger;
