//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var tomcat = new jsh.httpd.Tomcat({});
tomcat.map({
	path: "/",
	servlets: {
		"/*": {
			file: jsh.script.file.getRelativePath("file.servlet.js").file,
			parameters: {
				base: jsh.script.file.parent.parent.parent.parent.toString()
			}
		}
	}
});
tomcat.start();

jsh.shell.echo("Running on " + tomcat.port);

var client = new jsh.http.Client();
var url = "http://127.0.0.1:" + tomcat.port + "/jsh/test/jsh.script/loader.jsh.js";
var code = client.request({
	url: url
});
jsh.shell.echo(code.body.stream.character().asString());
jsh.shell.run({
	command: jsh.shell.java.launcher,
	arguments: ["-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar")].concat(url)
});
jsh.shell.echo("Success launching URL script: " + url);
