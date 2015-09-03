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
		//	Run server in Rhino debugger
		"debug:server": false,
		coffeescript: jsh.file.Pathname,
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
	var script = jsh.script.file.getRelativePath("../../../rhino/http/servlet/test/file.servlet.js").file;

	this.test = function(url) {
		var client = new jsh.http.Client();
		var response = client.request({
			url: url + "file/test/file.servlet.js"
		});
		if (response.status.code != 200) {
			if (response.status.code == 500) {
				jsh.shell.echo("Status: 500; body = " + response.body.stream.character().asString());
			}
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
			if (response.status.code == 500) {
				jsh.shell.echo("Status: 500; body = " + response.body.stream.character().asString());
			}
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
};

var manifestServlet = new function() {
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
		var json = eval("(" + value + ")");
		jsh.shell.echo("Got JSON: " + value);
	}
}

var coffeeServlet = new function() {
	var getString = function(response) {
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
		return response.body.stream.character().asString();
	}

	this.test = function(url) {
		var client = new jsh.http.Client();
		jsh.shell.echo("Testing coffee servlet at " + url);
		var response = client.request({
			url: url + "coffee/a"
		});
		var coffeeA = getString(response);
		if (coffeeA != "2") {
			fail("string = " + coffeeA);
		} else {
			jsh.shell.echo("Got correct string: " + coffeeA);
		}
		var response = client.request({
			url: url + "cup/file/b"
		});
		var cupFileB = getString(response);
		if (cupFileB != "3") {
			fail("string = " + cupFileB);
		} else {
			jsh.shell.echo("Got correct string: " + cupFileB);
		}
	}
};

var plugin = new function() {
	this.hello = function() {
		jsh.shell.echo("hello servlet");
		var tomcat = new jsh.httpd.Tomcat({
		});
		jsh.shell.echo("Tomcat port: " + tomcat.port);
		var script = jsh.script.file.getRelativePath("../../../rhino/http/servlet/test/hello.servlet.js").file;
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
		var script = jsh.script.file.getRelativePath("../../../rhino/http/servlet/test/file.servlet.js").file
		tomcat.map({
			path: "/",
			servlets: {
				"/*": {
					file: script
				}
			},
			//	TODO	is there a jsh.script.getFile()?
//			resources: jsh.httpd.Resources.script(jsh.script.getRelativePath("httpd.resources.js").file)
			resources: (function() {
				var rv = new jsh.httpd.Resources();
				jsh.loader.run(jsh.script.file.getRelativePath("httpd.resources.js"), {
					$mapping: new function() {
						this.getRelativePath = function(path) {
							return jsh.script.file.getRelativePath(path)
						}
					},
					map: function(string,pathname) {
						rv.add({
							prefix: string,
							loader: new jsh.file.Loader({ directory: pathname.directory })
						});
					}
				});
				if (!rv.loader) {
					throw new Error("rv.loader");
				}
				if (!rv.loader.resource) {
					throw new Error("rv.loader.resource");
				}
				return rv;
			})()
		});
		tomcat.start();
		fileServlet.test("http://127.0.0.1:" + tomcat.port + "/");
	}

	var run = function(path,tests) {
		jsh.shell.echo("Plugin: " + path);
		var tomcat = new jsh.httpd.Tomcat({});
		var script = jsh.script.file.getRelativePath("../../../" + path).file
		tomcat.map({
			path: "/",
			servlets: {
				"/*": {
					file: script
				}
			},
			//	TODO	is there a jsh.script.getFile()?
			resources: jsh.httpd.Resources.script(jsh.script.file.getRelativePath("httpd.resources.js").file)
		});
		tomcat.start();
		tests.test("http://127.0.0.1:" + tomcat.port + "/");
	}

	this.api = function() {
		jsh.shell.echo("plugin api servlet");
		var tomcat = new jsh.httpd.Tomcat({});
		var script = jsh.script.file.getRelativePath("../../../rhino/http/servlet/test/api.servlet.js").file
		tomcat.map({
			path: "/",
			servlets: {
				"/*": {
					file: script
				}
			},
			//	TODO	is there a jsh.script.getFile()?
			resources: jsh.httpd.Resources.script(jsh.script.file.getRelativePath("httpd.resources.js").file)
		});
		tomcat.start();
		apiServlet.test("http://127.0.0.1:" + tomcat.port + "/");
	};

	this.coffee = function() {
		run("rhino/http/servlet/test/coffee.servlet.coffee",coffeeServlet);
	}
};

var server = jsh.script.loader.file("server.js", {
	coffeescript: parameters.options.coffeescript,
	"tomcat.base": parameters.options["tomcat.base"],
	"debug:server": parameters.options["debug:server"]
}).server;

var suites = {
	plugin: function() {
		plugin.hello();
		plugin.file();
		plugin.api();
	},
	server: function() {
		server.start({
			"slime.hello": "WEB-INF/servlet/test/hello.servlet.js",
			"slime.file": "WEB-INF/servlet/test/file.servlet.js",
			"slime.api": "WEB-INF/servlet/test/api.servlet.js",
			"slime.manifest": "WEB-INF/servlet/test/manifest.servlet.js"
		});
		jsh.shell.echo("Test hello servlet inside Tomcat ...");
		helloServlet.test("http://127.0.0.1:" + server.port + "/slime.hello/");
		fileServlet.test("http://127.0.0.1:" + server.port + "/slime.file/");
		apiServlet.test("http://127.0.0.1:" + server.port + "/slime.api/");
		jsh.shell.echo("Test manifest servlet inside Tomcat ...");
		manifestServlet.test("http://127.0.0.1:" + server.port + "/slime.manifest/");
		server.stop();
	},
	manifest: function() {
		server.start({
			"slime.manifest": "WEB-INF/servlet/test/manifest.servlet.js"
		});
		manifestServlet.test("http://127.0.0.1:" + server.port + "/slime.manifest/");
		server.stop();
	},
	coffee: function() {
		plugin.coffee();
		if (server) {
			server.start({
				"slime.coffee": "WEB-INF/servlet/test/coffee.servlet.coffee"
			});
			jsh.shell.echo("Test coffee servlet inside Tomcat ...");
			coffeeServlet.test("http://127.0.0.1:" + server.port + "/slime.coffee/");
			server.stop();
		}
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