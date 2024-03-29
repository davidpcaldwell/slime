//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(function() {
	//	First, start server
	var server = new jsh.httpd.Tomcat({});
	server.map({
		path: "",
		servlets: {
			"/*": {
				file: jsh.script.file.getRelativePath("../../../../../rhino/http/servlet/test/file.servlet.js").file
			}
		},
		resources: (function() {
			var rv = new jsh.httpd.Resources();
			rv.map("", jsh.script.file.parent.pathname);
			return rv;
		})()
	});
	server.start();

	var client = new jsh.http.Client();
	jsh.shell.echo(client.request({
		url: "http://127.0.0.1:" + server.port + "/main.jsh.js",
		parse: function(response) {
			return response.body.stream.character().asString()
		}
	}));

	var buffer = new jsh.io.Buffer();
	var string;
	debugger;
	jsh.shell.jsh(
		"http://127.0.0.1:" + server.port + "/main.jsh.js",
		[],
		{
			stdout: buffer,
			onExit: function(result) {
				buffer.close();
				string = buffer.readText().asString()
			},
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				JSH_LAUNCHER_DEBUG: "rhino"
			})
		}
	);
	if (string != ("1 2" + String(Packages.java.lang.System.getProperty("line.separator")))) {
		throw new Error("Failed: string = " + string);
	} else {
		jsh.shell.echo("Success! Got " + string);
	}
})()
