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
		chrome: jsh.file.Pathname,
		firefox: jsh.file.Pathname,
		ie: jsh.file.Pathname,
		coffeescript: jsh.file.Pathname
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!jsh.httpd || !jsh.httpd.Tomcat) {
	jsh.shell.stderr.write("Cannot run browser tests; Tomcat not present.\n");
	jsh.shell.exit(1);
}

var all = [
	"loader/test/data/a/", "loader/test/data/b/", "loader/test/data/c/main.js",
	"loader/test/data/coffee/",
	"js/object/","js/object/Error.js",
	"js/web/"
	,"js/document/","js/mime/"
].map(function(path) {
	return { path: path };
});

jsh.shell.echo("Running browser unit tests ...");
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

var browserTest = function(p) {
	var startServer = function(p) {
		var tomcat = new jsh.httpd.Tomcat({});
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
		if (result === false) {
			throw new Error("Browser tests failed." + ((p.message) ? (" " + p.message) : ""));
		} else if (result === true) {
			jsh.shell.echo("Browser tests succeeded." + ((p.message) ? (" " + p.message) : ""));
		} else if (result === null) {
			throw new Error("Browser tests errored." + ((p.message) ? (" " + p.message) : ""));
		} else {
			throw new Error("Error launching browser tests: " + result);
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

var ie;
if (parameters.options.ie) {
	ie = new Browser({
		open: function(on) {
			return function(uri) {
				jsh.shell.echo("Opening IE ...");
				jsh.shell.echo("Command: " + parameters.options.ie.file);
				jsh.shell.echo("Arguments: " + uri);
				jsh.shell.run({
					command: parameters.options.ie.file,
					arguments: [
						uri
					],
					on: on
				});
			};
		}
	});
}

var firefox;
if (parameters.options.firefox) {
	firefox = new Browser({
		open: function(on) {
			return function(uri) {
				jsh.shell.run({
					command: parameters.options.firefox.file,
					arguments: [
						uri
					],
					on: on
				});
			};
		}
	})
}

var chrome;
if (parameters.options.chrome) {
	chrome = new function() {
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
						command: parameters.options.chrome.file,
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
	}
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

if (modules) {
	var browsers = [];
	if (chrome) browsers.push(chrome);
	if (ie) browsers.push(ie);
	if (firefox) browsers.push(firefox);
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
				url: (browser != ie) ? request.build() : getBrowserTestRequest([]).build(),
				success: (parameters.options.interactive) ? null : slimepath + "loader/browser/test/success"
			}, (parameters.options.coffeescript) ? { parameters: { coffeescript: parameters.options.coffeescript } } : {}));
		})
	} catch (e) {
		if (e.rhinoException) {
			e.rhinoException.printStackTrace();
		}
		if (e.javaException) {
			e.javaException.printStackTrace();
		}
		throw e;
	}
}