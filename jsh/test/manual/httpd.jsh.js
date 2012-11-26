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

var tomcat = new jsh.httpd.Tomcat({
});
jsh.shell.echo("Tomcat port: " + tomcat.port);
var script = jsh.script.getRelativePath("../../../rhino/http/servlet/test/hello.servlet.js").file;
tomcat.map({
	path: "/",
	servlets: {
		"/*": script
	}
});
tomcat.start();
var client = new jsh.http.Client();
var response = client.request({
	url: "http://127.0.0.1:" + tomcat.port + "/"
});
if (!/^text\/plain/.test(response.body.type)) {
	jsh.shell.echo("Type = " + response.body.type);
	jsh.shell.exit(1);
}
var string = response.body.stream.character().asString();
if (string != "Hello, World!") {
	jsh.shell.echo("string = " + string);
	jsh.shell.exit(1);
};
jsh.shell.echo("Success! " + jsh.script.file);
jsh.shell.exit(0);
