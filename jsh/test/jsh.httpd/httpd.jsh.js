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

var parameters = jsh.script.getopts({
	options: {
		"tomcat.base": jsh.file.Pathname,
		"debug:server": false,
		suite: "all"
	}
});

//	TODO	probably should use addShutdownHook to stop server; right now, if run in debug mode, does not shut down on success.
var fail = function(reason) {
	server.stop();
	jsh.shell.echo(reason);
	jsh.shell.exit(1);
}

var helloServlet = new function() {
	this.test = function(url) {
		var client = new jsh.http.Client();
		jsh.shell.echo("Testing hello servlet at " + url);
		var response = client.request({
			url: url
		});
		if (response.status.code != 200) {
			if (response.status.code == 500) {
				jsh.shell.echo("Status: 500; body = " + response.body.stream.character().asString());
			}
			fail("Response is wrong status: " + response.status.code);
		}
		if (!/^text\/plain/.test(response.body.type)) {
			fail("Response is wrong type: " + response.body.type);
		} else {
			jsh.shell.echo("Got correct type: " + response.body.type);
		}
		var string = response.body.stream.character().asString();
		if (string != "Hello, World!") {
			fail("string = " + string);
		} else {
			jsh.shell.echo("Got correct string: " + string);
		}
	}
};

var fileServlet = new function() {
	var script = jsh.script.getRelativePath("../../../rhino/http/servlet/test/file.servlet.js").file;

	this.test = function(url) {
		var client = new jsh.http.Client();
		var response = client.request({
			url: url + "test/file.servlet.js"
		});
		if (response.status.code != 200) {
			fail("status = " + response.status.code);
		}
		jsh.shell.echo(response.body.type);
		var code = {
			http: response.body.stream.character().asString(),
			file: script.read(String)
		};
		if (code.http != code.file) {
			fail("did not match code");
		} else {
			jsh.shell.echo("code matches: http = " + code.http + " file = " + code.file);
		}
	}
};

var apiServlet = new function() {
	this.test = function(url) {
		var client = new jsh.http.Client();
		var response = client.request({
			url: url
		});
		if (response.status.code != 200) {
			fail("status = " + response.status.code);
		}
		jsh.shell.echo(response.body.type);
		var value = response.body.stream.character().asString();
		if (value == "true") {
			jsh.shell.echo("Got response 'true' as expected.");
		} else {
			fail("Did not match value: " + value);
		}
	}
}

var plugin = new function() {
	this.hello = function() {
		jsh.shell.echo("hello servlet");
		var tomcat = new jsh.httpd.Tomcat({
		});
		jsh.shell.echo("Tomcat port: " + tomcat.port);
		var script = jsh.script.script.getRelativePath("../../../rhino/http/servlet/test/hello.servlet.js").file;
		tomcat.map({
			path: "/",
			servlets: {
				"/*": {
					file: script
				}
			}
		});
		tomcat.start();
		helloServlet.test("http://127.0.0.1:" + tomcat.port + "/");
	};

	this.file = function() {
		jsh.shell.echo("file servlet");
		var tomcat = new jsh.httpd.Tomcat({});
		var script = jsh.script.getRelativePath("../../../rhino/http/servlet/test/file.servlet.js").file
		tomcat.map({
			path: "/",
			servlets: {
				"/*": {
					file: script
				}
			},
			//	TODO	is there a jsh.script.getFile()?
			resources: jsh.httpd.Resources.script(jsh.script.getRelativePath("httpd.resources.js").file)
		});
		tomcat.start();
		fileServlet.test("http://127.0.0.1:" + tomcat.port + "/");
	}

	this.api = function() {
		jsh.shell.echo("plugin api servlet");
		var tomcat = new jsh.httpd.Tomcat({});
		var script = jsh.script.getRelativePath("../../../rhino/http/servlet/test/api.servlet.js").file
		tomcat.map({
			path: "/",
			servlets: {
				"/*": {
					file: script
				}
			},
			//	TODO	is there a jsh.script.getFile()?
			resources: jsh.httpd.Resources.script(jsh.script.getRelativePath("httpd.resources.js").file)
		});
		tomcat.start();
		apiServlet.test("http://127.0.0.1:" + tomcat.port + "/");
	}
};

var server = (function() {
	if (!jsh.file.Pathname("/bin/sh").file) {
		jsh.shell.echo("No Bourne shell at /bin/sh; cannot run automated inside-Tomcat tests");
		return;
	}
	if (!jsh.shell.environment.CATALINA_HOME) {
		jsh.shell.echo("No $CATALINA_HOME; cannot run automated inside-Tomcat tests");
		return;
	}
	return new function() {
		var environment = {
			CATALINA_HOME: jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory,
			CATALINA_BASE: (function() {
				if (parameters.options["tomcat.base"]) {
					return parameters.options["tomcat.base"].directory;
				} else {
					return jsh.shell.TMPDIR.createTemporary({ directory: true });
				}
			})()
		};
		jsh.shell.echo("CATALINA_HOME: " + environment.CATALINA_HOME);
		jsh.shell.echo("CATALINA_BASE: " + environment.CATALINA_BASE);

		var tomcat = jsh.script.loader.file("httpd.tomcat.js");
		var installation = new tomcat.Tomcat({
			home: environment.CATALINA_HOME
		});
		var server = new installation.Base({
			base: environment.CATALINA_BASE,
			configuration: environment.CATALINA_HOME.getFile("conf/server.xml")
		});

		var build = function() {
			jsh.shell.echo("Building webapps ...");

			var buildWebapp = function(urlpath,servletpath) {
				//	TODO	may want to move this to httpd.tomcat.js, although it would need to somehow be aware of location of
				//			webapp.jsh.js
				jsh.shell.jsh(
					jsh.script.getRelativePath("../../../rhino/http/servlet/tools/webapp.jsh.js"),
					[
						"-to", environment.CATALINA_BASE.getSubdirectory("webapps").getRelativePath(urlpath),
						"-servletapi", environment.CATALINA_HOME.getRelativePath("lib/servlet-api.jar"),
						"-resources", jsh.script.getRelativePath("httpd.resources.js"),
						"-servlet", servletpath
					],
					{
						onExit: function(result) {
							jsh.shell.echo("Command: " + [result.command].concat(result.arguments).join(" "));
							jsh.shell.echo("Status: " + result.status);
							if (result.status) {
								throw new Error("Exit status: " + result.status);
							}
						}
					}
				);
			};
			buildWebapp("slime.hello", "test/hello.servlet.js");
			buildWebapp("slime.file", "test/file.servlet.js");
			buildWebapp("slime.api", "test/api.servlet.js");
		}

		this.start = function() {
			build();
			jsh.shell.echo("Invoking Tomcat start script ...");
			server.start({
				debug: {
					script: parameters.options["debug:server"]
				}
			});
			//	TODO	horrifying synchronization strategy
			jsh.shell.echo("Invoked Tomcat start script ...");
			debugger;
			jsh.shell.echo("Pausing to let Tomcat start ...");
			Packages.java.lang.Thread.sleep(5000);
			jsh.shell.echo("Continuing, assuming Tomcat has started.");
		}

		this.stop = function() {
			server.stop();
		}
	};
})();

var suites = {
	plugin: function() {
		plugin.hello();
		plugin.file();
		plugin.api();
	},
	server: function() {
		server.start();
		jsh.shell.echo("Test hello servlet inside Tomcat ...");
		helloServlet.test("http://127.0.0.1:8080/slime.hello/");
		fileServlet.test("http://127.0.0.1:8080/slime.file/");
		apiServlet.test("http://127.0.0.1:8080/slime.api/");
		server.stop();
	},
	all: function() {
		this.plugin();
		if (server) {
			this.server();
		}
	}
};

suites[parameters.options.suite]();

jsh.shell.echo("Success! " + jsh.script.file);
jsh.shell.exit(0);
