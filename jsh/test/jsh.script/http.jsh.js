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

var parameters = jsh.script.getopts({
	options: {
		debug: false
	}
});

if (jsh.test) jsh.test.requireBuiltShell({
	executable: false
});

var tomcat = new jsh.httpd.Tomcat({});
jsh.shell.console("parent: " + jsh.script.file.parent.parent.parent.parent.toString());
tomcat.map({
	path: "/",
	servlets: {
		"/*": {
			file: jsh.script.file.parent.getFile("file.servlet.js"),
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
jsh.shell.console("Script text:");
jsh.shell.console(code.body.stream.character().asString());
jsh.shell.jsh({
	shell: jsh.shell.jsh.home,
	script: url,
	environment: jsh.js.Object.set({}, jsh.shell.environment, {
		JSH_SCRIPT_DEBUGGER: (parameters.options.debug) ? "rhino" : "none"
	})
});
jsh.shell.echo("Success launching URL script: " + url);
