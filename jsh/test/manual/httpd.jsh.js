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

var parameters = jsh.script.getopts({
	options: {
		"tomcat.home": jsh.file.Pathname,
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
				"/*": script
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
				"/*": script
			},
			//	TODO	is there a jsh.script.getFile()?
			resources: new jsh.httpd.Resources(jsh.script.getRelativePath("httpd.resources.js").file)
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
				"/*": script
			},
			//	TODO	is there a jsh.script.getFile()?
			resources: new jsh.httpd.Resources(jsh.script.getRelativePath("httpd.resources.js").file)
		});
		tomcat.start();
		apiServlet.test("http://127.0.0.1:" + tomcat.port + "/");		
	}
};

var server = new function() {
	if (!jsh.file.Pathname("/bin/sh").file) {
		jsh.shell.echo("No Bourne shell");
		return;
	}
	if (!parameters.options["tomcat.home"]) {
		jsh.shell.echo("No tomcat.home");
		return;
	}
	var environment = {
		CATALINA_HOME: parameters.options["tomcat.home"].directory,
		CATALINA_BASE: (function() {
			if (parameters.options["tomcat.base"]) {
				return parameters.options["tomcat.base"].directory;
			} else {
				return jsh.shell.TMPDIR.createTemporary({ directory: true });
			}
		})(),
		SLIME_SCRIPT_DEBUGGER: (parameters.options["debug:server"]) ? "rhino" : "none"
	};
	jsh.shell.echo("CATALINA_HOME: " + environment.CATALINA_HOME);
	jsh.shell.echo("CATALINA_BASE: " + environment.CATALINA_BASE);
	jsh.shell.echo("SLIME_SCRIPT_DEBUGGER: " + environment.SLIME_SCRIPT_DEBUGGER);
	
	var webapps;
	
	var initialize = function() {
		environment.CATALINA_HOME.getFile("conf/server.xml").copy(environment.CATALINA_BASE.getRelativePath("conf/server.xml"), {
			recursive: true
		});
		environment.CATALINA_BASE.getRelativePath("logs").createDirectory({
			ifExists: function(dir) {
				return false;
			}
		});
		environment.CATALINA_BASE.getRelativePath("temp").createDirectory({
			ifExists: function(dir) {
				return false;
			}
		});
		webapps = environment.CATALINA_BASE.getRelativePath("webapps").createDirectory({
			ifExists: function(dir) {
				return false;
			},
			recursive: true
		});		
	};
	
	var build = function() {
		jsh.shell.echo("Building webapps ...");

		var buildWebapp = function(urlpath,servletpath) {
			jsh.shell.jsh(
				jsh.script.getRelativePath("../../../rhino/http/servlet/tools/webapp.jsh.js"),
				[
					"-to", webapps.getRelativePath(urlpath),
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
	
	var started = false;
	
	var catalina = function(command) {
		return function() {
			jsh.shell.shell(
				jsh.file.Pathname("/bin/sh"),
				[
					parameters.options["tomcat.home"].directory.getRelativePath("bin/catalina.sh"),
					command
				],
				{
					environment: jsh.js.Object.set({}, jsh.shell.environment, {
						//	Strip trailing slashes from path names, which appear to confuse catalina.sh
						//	TODO	see if it works without the stripping
						CATALINA_BASE: environment.CATALINA_BASE.toString().substring(0,environment.CATALINA_BASE.toString().length-1),
						CATALINA_HOME: environment.CATALINA_HOME.toString().substring(0,environment.CATALINA_HOME.toString().length-1),
						SLIME_SCRIPT_DEBUGGER: environment.SLIME_SCRIPT_DEBUGGER
					}),
					onExit: function(result) {
						jsh.shell.echo("Executed " + command + " with status: " + result.status);
					}
				}
			);
		}
	};
	
	this.start = function() {
		initialize();
		build();
		jsh.shell.echo("Starting server at " + environment.CATALINA_HOME + " with base " + environment.CATALINA_BASE + " ...");
		
		new jsh.java.Thread(catalina("run")).start();
		started = true;
		//	TODO	horrifying synchronization strategy
		debugger;
		Packages.java.lang.Thread.sleep(2000);
	}
	
	this.stop = function() {
		if (started) {
			catalina("stop")();
		}
	}
}

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
		this.server();
	}
};

suites[parameters.options.suite]();

jsh.shell.echo("Success! " + jsh.script.file);	
jsh.shell.exit(0);
