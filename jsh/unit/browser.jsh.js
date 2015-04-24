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

	//	Linux
	add("chrome", "/opt/google/chrome/chrome");
	return rv;
})();

var modules = parameters.arguments.map(function(argument) { return jsh.file.Pathname(argument); });
jsh.shell.echo("Running " + modules.length + " browser unit tests ...");
jsh.shell.echo(modules.map(function(object) { return object; }).join(" "));

var MODULES = new jsh.unit.browser.Modules(jsh.script.file.parent.parent.parent,modules);
//modules = MODULES.modules;
//var slimepath = MODULES.slimepath;
//var common = MODULES.common;

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
	})
};

if (modules.length && browsers.length) {
	//	TODO	handle zero modules or zero browsers more intelligently
	try {
		browsers.forEach(function(browser) {
			(function(p) {
				MODULES.test(p);
				//	TODO	parameters.options below really is only for
			})(jsh.js.Object.set({}, { port: parameters.options.port, interactive: parameters.options.interactive, coffeescript: parameters.options.coffeescript }, { browser: browser }))
		});
		jsh.shell.echo("Tests in all browsers: " + "[" + browsers.map(function(browser) { return browser.name; }).join(", ") + "]" + " succeeded.");
	} catch (e) {
		if (e.rhinoException) {
			e.rhinoException.printStackTrace();
		}
		if (e.javaException) {
			e.javaException.printStackTrace();
		}
		if (!e.rhinoException && !e.javaException && e.stack) {
			Packages.java.lang.System.err.println(e.stack);
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