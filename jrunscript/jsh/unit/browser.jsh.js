//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("loader/api"))
		jsh.loader.plugins(jsh.script.file.parent.pathname);

		var parameters = jsh.script.getopts({
			options: {
				//	TODO	I guess ideally when running interactive tests, closing the browser should end the program, but haven't thought
				//			about how to implement that. In any case, there are some design problems here, as one should be limited to a
				//			single browser when running interactive tests, and so forth
				interactive: false,
				view: "console",
				port: Number,
				ie: false,
				safari: false,
				firefox: false,
				chrome: false,
				"chrome:instance": jsh.file.Pathname,
				//	-chrome:profile is deprecated
				"chrome:profile": jsh.file.Pathname,
				browser: jsh.script.getopts.OBJECT(jsh.file.Pathname),
				coffeescript: jsh.file.Pathname
			},
			unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		});

		(function() {
			var old = parameters.options["chrome:profile"];
			var instance = parameters.options["chrome:instance"];
			if (old && instance) {
				if (old.toString() != instance.toString()) {
					jsh.shell.console("-chrome:instance (" + instance + ") and deprecated -chrome:profile (" + old + ") conflict.");
					jsh.shell.exit(1);
				} else {
					jsh.shell.console("Both -chrome:instance and deprecated -chrome:profile specified.");
				}
			} else if (old && !instance) {
				parameters.options["chrome:instance"] = old;
			}
		})();

		if (!jsh.httpd || !jsh.httpd.Tomcat) {
			jsh.shell.stderr.write("Cannot run browser tests; Tomcat not present.\n");
			jsh.shell.exit(1);
		}

		if (!jsh.java.Thread) {
			jsh.shell.echo("Cannot run browser tests; jsh.java.Thread not implemented; use Rhino, not Nashorn", { stream: jsh.shell.stderr });
			jsh.shell.exit(1);
		}

		if (parameters.options["chrome:instance"]) {
			parameters.options.chrome = true;
		}

		var browsers = (function() {
			var useSpecificBrowsers = (
				parameters.options.ie || parameters.options.safari || parameters.options.firefox || parameters.options.chrome
				|| Object.keys(parameters.options.browser).length
			);

			var rv = [];

			["IE","Safari","Firefox","Chrome"].forEach(function(name) {
				var property = name.toLowerCase();
				if (!useSpecificBrowsers || parameters.options[property]) {
					var pathname = parameters.options.browser[property];
					if (pathname) {
						rv.push(new jsh.unit.browser[name]({ program: pathname.file }));
					} else if (jsh.unit.browser.installed[property]) {
						if (property == "chrome" && parameters.options["chrome:instance"]) {
							var directory = parameters.options["chrome:instance"].createDirectory({
								ifExists: function(dir) {
									return false;
								},
								recursive: true
							});
							rv.push(new jsh.unit.browser.Chrome({ user: directory }))
						} else {
							rv.push(jsh.unit.browser.installed[property]);
						}
					}
				}
			});

			return rv;
		})();

		var modules = parameters.arguments.map(function(argument) { return jsh.file.Pathname(argument); });
		jsh.shell.echo("Running " + modules.length + " browser unit tests ...");
		jsh.shell.echo(modules.map(function(object) { return object; }).join(" "));

		var MODULES = (modules.length) ? new jsh.unit.browser.Modules(jsh.script.file.parent.parent.parent,modules) : null;
		jsh.shell.echo("browsers = " + browsers);
		if (MODULES && browsers.length) {
			//	TODO	handle zero modules or zero browsers more intelligently
			try {
				var scenario = new jsh.unit.Suite({
					name: "Browser tests"
				});
				jsh.unit.view.options.select(parameters.options.view).listen(scenario);
				browsers.forEach(function(browser) {
					scenario.scenario(String(arguments[1]),MODULES.test({
						coffeescript: parameters.options.coffeescript,
						port: parameters.options.port,
						browser: browser,
						interactive: parameters.options.interactive
					}));
					// scenario.add({
					// 	scenario: MODULES.test({
					// 		coffeescript: parameters.options.coffeescript,
					// 		port: parameters.options.port,
					// 		browser: browser,
					// 		interactive: parameters.options.interactive
					// 	})
					// });
				});
				if (parameters.options.interactive) {
					jsh.shell.exit(0);
				}
				var rv = scenario.run();
				if (rv) {
					jsh.shell.echo("Tests in all browsers: " + "[" + browsers.map(function(browser) { return browser.name; }).join(", ") + "]" + " succeeded.");
					jsh.shell.exit(0);
				} else {
					jsh.shell.echo("Tests failed.");
					jsh.shell.exit(1);
				}
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
			if (!MODULES) {
				jsh.shell.echo("No modules to run.");
			}
			if (!browsers.length) {
				jsh.shell.echo("No browsers selected.");
			}
			jsh.shell.exit(1);
		}
	}
)();
