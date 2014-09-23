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
		interactive: false,
		port: Number,
		ie: false,
		safari: false,
		firefox: false,
		chrome: false,
		browser: jsh.script.getopts.OBJECT(jsh.file.Pathname),
		coffeescript: jsh.file.Pathname
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!jsh.httpd || !jsh.httpd.Tomcat) {
	jsh.shell.stderr.write("Cannot run browser tests; Tomcat not present.\n");
	jsh.shell.exit(1);
}

if (!jsh.java.Thread) {
	jsh.shell.echo("Cannot run browser tests; jsh.java.Thread not implemented; use Rhino, not Nashorn", { stream: jsh.shell.stderr });
	jsh.shell.exit(1);
}

var browsers = [];

var programs = (function() {
	var useSpecificBrowsers = (
		parameters.options.ie || parameters.options.safari || parameters.options.firefox || parameters.options.chrome
		|| Object.keys(parameters.options.browser).length
	);

	var rv = {};
	for (var x in parameters.options.browser) {
		rv[x] = parameters.options.browser[x].file;
	}

	var add = function(browser,path) {
		if ((!useSpecificBrowsers || parameters.options[browser]) && !rv[browser] && jsh.file.Pathname(path).file) {
			rv[browser] = jsh.file.Pathname(path).file;
		}
	};

	//	Windows
	add("ie","C:\\Program Files\\Internet Explorer\\iexplore.exe");

	//	Mac OS X
	add("safari","/Applications/Safari.app/Contents/MacOS/Safari");
	add("firefox","/Applications/Firefox.app/Contents/MacOS/firefox");
	add("chrome","/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
	return rv;
})();

var api = eval(jsh.script.file.getRelativePath("../etc/api.js").file.read(String));
var all = api.environment("browser").filter(function(declaration) {
	return declaration.api || declaration.test;
});

jsh.shell.echo("Running " + all.length + " browser unit tests ...");
var modules = (parameters.arguments.length == 0) ? all : parameters.arguments.map(function(path) { return { path: path } });

var slimepath = "";

var browseTestPage = function(p) {
	var opened = this.browse(p.tomcat.url(p.url));
	if (p.success) {
		var response = p.client.request({
			url: p.tomcat.url(p.success)
		});
		if (opened && opened.close) {
			opened.close();
		}
		var string = response.body.stream.character().asString();
		if (string == "false") return false;
		if (string == "true") return true;
		if (string == "null") return null;
		return string;
	}
};
var port = parameters.options.port;

var browserTest = function(p) {
	var startServer = function(p) {
		var tomcat = new jsh.httpd.Tomcat({
			port: port
		});
		var parameters = {
			delegate: p.servlet,
			url: p.success
		};
		for (var x in p.parameters) {
			parameters[x] = p.parameters[x];
		}
		jsh.shell.echo("Starting server ...");
		tomcat.map({
			path: "",
			servlets: {
				//	alternative would be to allow an actual servlet, rather than file, to be specified using servlet plugin
				//	and then somehow control threading from here: servlet could be defined above and could receive browser
				//	callback and release lock allowing loop to proceed
				//	TODO	should we enhance the servlet plugin interface to allow something other than a file?
				"/*": {
					file: jsh.script.file.getRelativePath("browser.servlet.js").file,
					parameters: parameters
				}
			},
			resources: p.resources
		});
		tomcat.start();
		jsh.shell.echo("Tomcat base directory: " + tomcat.base);
		return new function() {
			this.port = tomcat.port;

			this.url = function(url) {
				return "http://127.0.0.1:" + tomcat.port + "/" + url;
			};

			this.run = function() {
				tomcat.run();
			}
		};
	};

	var tomcat = startServer(p);
	var result = this.browseTestPage(jsh.js.Object.set({}, { tomcat: tomcat, client: new jsh.http.Client() }, p));
	if (!p.success) {
		tomcat.run();
	} else {
		var name = (this.name) ? this.name : "Browser";
		if (result === false) {
			throw new Error(name + " tests failed." + ((p.message) ? (" " + p.message) : ""));
		} else if (result === true) {
			jsh.shell.echo(name + " tests succeeded." + ((p.message) ? (" " + p.message) : ""));
		} else if (result === null) {
			throw new Error(name + " tests errored." + ((p.message) ? (" " + p.message) : ""));
		} else {
			throw new Error("Error launching " + name + " tests: " + result);
		}
	}
};

var Browser = function(p) {
	var lock = new jsh.java.Thread.Monitor();
	var opened;

	var on = {
		start: function(p) {
			new lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					opened = new function() {
						this.close = function() {
							jsh.shell.echo("Killing browser process " + p + " ...");
							p.kill();
							jsh.shell.echo("Killed.");
						}
					}
				}
			})();
		}
	};

	this.name = p.name;

	this.filter = (p.exclude) ?
		function(module) {
			if (p.exclude(module)) {
				return false;
			}
			return true;
		}
		: function(module) {
			return true;
		}
	;

	this.browse = function(uri) {
		jsh.shell.echo("Starting browser thread...");
		jsh.java.Thread.start({
			call: function() {
				p.open(on)(uri);
			}
		});
		var returner = new lock.Waiter({
			until: function() {
				return Boolean(opened);
			},
			then: function() {
				return opened;
			}
		});
		return returner();
	};

	this.browseTestPage = browseTestPage;
	this.browserTest = browserTest;
};

if (programs.ie) {
	browsers.push(new Browser({
		name: "Internet Explorer",
		open: function(on) {
			return function(uri) {
				jsh.shell.run({
					command: programs.ie,
					arguments: [
						uri
					],
					on: on
				});
			};
		}
	}));
};

if (programs.safari) {
	browsers.push(new Browser({
		name: "Safari",
		open: function(on) {
			return function(uri) {
				jsh.shell.run({
					command: "open",
					arguments: [
						"-a", programs.safari.parent.parent.parent.toString(),
						uri
					],
					on: on
				});
			};
		}
	}));
};

if (programs.firefox) {
	browsers.push(new Browser(new function() {
		var PROFILE = jsh.shell.TMPDIR.createTemporary({ directory: true });

		this.name = "Firefox";

		this.open = function(on) {
			return function(uri) {
				jsh.shell.run({
					command: programs.firefox,
					arguments: [
						"-no-remote",
						"-profile", PROFILE.toString(),
						uri
					],
					on: on
				});
			};
		};
	}))
}

if (programs.chrome) {
	browsers.push(new function() {
		this.name = "Google Chrome";

		this.filter = function(module) {
			return true;
		}

		this.browse = function(uri) {
			var lock = new jsh.java.Thread.Monitor();
			var opened;
			jsh.java.Thread.start({
				call: function() {
					var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
					TMP.getRelativePath("First Run").write("", { append: false });
					jsh.shell.echo("Running with data directory: " + TMP);
					jsh.shell.run({
						command: programs.chrome,
						arguments: [
							"--user-data-dir=" + TMP,
							uri
						],
						on: {
							start: function(p) {
								new lock.Waiter({
									until: function() {
										return true;
									},
									then: function() {
										opened = new function() {
											this.close = function() {
												p.kill();
											}
										}
									}
								})();
							}
						}
					});
				}
			});
			var returner = new lock.Waiter({
				until: function() {
					return Boolean(opened);
				},
				then: function() {
					return opened;
				}
			});
			return returner();
		};

		this.browseTestPage = browseTestPage;
		this.browserTest = browserTest;
	})
};

var getBrowserTestRequest = function(modules) {
	jsh.shell.echo("Testing modules ...");
	modules.forEach(function(item) {
		jsh.shell.echo("Testing module: " + item.path);
	});
	debugger;
	var url = slimepath + "loader/browser/test/client.html";
	var parameters = [];
	modules.forEach(function(item) {
		parameters.push({ name: "module", value: "../../../" + slimepath.split("/").map(function(item) { return ""; }).join("../") + item.path });
	});
	return {
		url: url,
		parameters: parameters,
		build: function() {
			//	TODO	do we not have a library somewhere that does this?
			var urlencode = function(s) {
				return String(Packages.java.net.URLEncoder.encode(s));
			};

			return this.url + "?" + this.parameters.map(function(item) {
				return urlencode(item.name) + "=" + urlencode(item.value);
			}).join("&");
		}
	};
};

if (modules.length && browsers.length) {
	//	TODO	handle zero modules or zero browsers more intelligently
	try {
		browsers.forEach(function(browser) {
			var request = getBrowserTestRequest(modules.filter(browser.filter));
			if (!parameters.options.interactive) {
				request.parameters.push({ name: "callback", value: "server" });
			}
			jsh.shell.echo("fullurl = " + request.build());
			browser.browserTest(jsh.js.Object.set({}, {
				resources: (function() {
					var rv = new jsh.httpd.Resources();
					rv.map("", jsh.script.file.getRelativePath("../../"));
					return rv;
				})(),
				servlet: "jsh/test/browser.modules.js",
				url: request.build(),
				success: (parameters.options.interactive) ? null : slimepath + "loader/browser/test/success"
			}, (parameters.options.coffeescript) ? { parameters: { coffeescript: parameters.options.coffeescript } } : {}));
		});
		jsh.shell.echo("Tests in all browsers: " + "[" + browsers.map(function(browser) { return browser.name; }).join(", ") + "]" + " succeeded.");
	} catch (e) {
		if (e.rhinoException) {
			e.rhinoException.printStackTrace();
		}
		if (e.javaException) {
			e.javaException.printStackTrace();
		}
		throw e;
	}
} else {
	if (!modules.length) {
		jsh.shell.echo("No modules to run.");
	}
	if (!browsers.length) {
		jsh.shell.echo("No browsers selected.");
	}
	jsh.shell.exit(1);
}