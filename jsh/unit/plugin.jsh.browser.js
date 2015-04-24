//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Modules = function(slime,pathnames) {
	var common = (function() {
		var isCommonAncestor = function(directory,list) {
			for (var i=0; i<list.length; i++) {
				var prefix = directory.toString();
				if (list[i].toString().substring(0,prefix.length) != prefix) {
					return false;
				}
			}
			return true;
		}

		var paths = [slime.getRelativePath("jsh/unit")].concat(pathnames);
		var directory = slime.getSubdirectory("jsh/unit");
		while(!isCommonAncestor(directory,paths)) {
			directory = directory.parent;
		}
		return directory;
	})();
	jsh.shell.echo("common = " + common);
	this.common = common;

	var slimepath = slime.toString().substring(common.toString().length).split("/").slice(0,-1).join("/") + "/";
	jsh.shell.echo("slimepath = " + slimepath);
	this.slimepath = slimepath;

	modules = pathnames.map(function(pathname) {
		var string = (pathname.directory) ? pathname.directory.toString() : pathname.toString();
		return { path: string.substring(common.toString().length) };
	});
	jsh.shell.echo("modules = " + modules.map(function(module) { return module.path; }));
	this.modules = modules;

	var browserTest = function(p) {
		var startServer = function(p) {
			var tomcat = new jsh.httpd.Tomcat({
				port: p.port
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
						file: slime.getFile("jsh/unit/browser.servlet.js"),
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

		var browseTestPage = function(p) {
			var opened = p.browser.browse(p.tomcat.url(p.url));
			if (p.success) {
				var output = p.client.request({
					url: p.tomcat.url(p.success.split("/").slice(0,-1).join("/") + "/console")
				});
				var response = p.client.request({
					url: p.tomcat.url(p.success)
				});
				if (opened && opened.close) {
					opened.close();
				}
				var success = (function(string) {
					if (string == "false") return false;
					if (string == "true") return true;
					if (string == "null") return null;
					return string;
				})(response.body.stream.character().asString());

				return {
					console: JSON.parse(output.body.stream.character().asString()),
					success: success
				};
			}
		};

		var tomcat = startServer(p);
		jsh.shell.echo("Browsing test page ... " + p.url);
		var result = browseTestPage(jsh.js.Object.set({}, { tomcat: tomcat, client: new jsh.http.Client() }, p));
		if (!p.success) {
			tomcat.run();
		} else {
			var name = (p.browser.name) ? p.browser.name : "Browser";
			var console = new jsh.unit.console.subprocess.Receiver({ name: name });
			var scenario = new jsh.unit.Scenario(console.top);
			var thread = jsh.java.Thread.start(function() {
				scenario.run({
					console: new jsh.unit.console.Stream({
						writer: jsh.shell.stdio.output
					})
				});
			});
			result.console.forEach(function(event) {
				console.queue(event);
			});
			console.finish();
			thread.join();
			if (result.success === false) {
				throw new Error(name + " tests failed." + ((p.message) ? (" " + p.message) : ""));
			} else if (result.success === true) {
				jsh.shell.echo(name + " tests succeeded." + ((p.message) ? (" " + p.message) : ""));
			} else if (result.success === null) {
				throw new Error(name + " tests errored." + ((p.message) ? (" " + p.message) : ""));
			} else {
				throw new Error("Error launching " + name + " tests: " + result);
			}
		}
	};

	this.test = function(p) {
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

		var request = getBrowserTestRequest(modules.filter(p.browser.filter));
		if (!p.interactive) {
			request.parameters.push({ name: "callback", value: "server" });
		}
		jsh.shell.echo("fullurl = " + request.build());
		browserTest(jsh.js.Object.set({}, {
			browser: p.browser,
			resources: (function() {
				var rv = new jsh.httpd.Resources.Old();
				rv.map("", common.pathname);
				return rv;
			})(),
			servlet: slimepath + "jsh/test/browser.modules.js",
			url: request.build(),
			success: (p.interactive) ? null : slimepath + "loader/browser/test/success"
		}, (p.coffeescript) ? { parameters: { coffeescript: p.coffeescript } } : {}));
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
};

$exports.Browser = Browser;
