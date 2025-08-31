//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages, $api, jsh) {
		jsh.shell.tools.tomcat.old.require();

		var parameters = jsh.script.getopts({
			options: {
				//	Runs a series of definitions
				suite: jsh.file.Pathname,

				//	Runs a single definition; optionally just a single part of that definition
				definition: jsh.file.Pathname,
				part: String,

				//	Necessary if the suite references pages outside the hierarchy defined by suite / launching page / SLIME installation
				base: jsh.file.Pathname,

				parameter: jsh.script.getopts.ARRAY(String),

				browser: String,
				interactive: false,

				"chrome:instance": jsh.file.Pathname,
				"chrome:debug:vscode": false,
				"chrome:debug:port": Number,

				view: "console"
			}
		});

		if (!parameters.options.browser) {
			parameters.options.browser = [
				jsh.unit.browser.installed[0].id
			];
		}

		if (parameters.options.part) {
			// TODO: Currently with the way the unit testing for paths is duct-taped together, non-interactively running part of a browser
			// suite does not work -- the browser does not exit -- for unknown reasons. Not really an important use case.
			parameters.options.interactive = true;
		}

		if (parameters.options.view == "chrome") {
			// TODO: For some reason "chrome" does not work; not that it would be useful, since tests are already being run in a browser
			jsh.shell.console("Unsupported: -view chrome [use 'console' or 'stdio']");
			jsh.shell.exit(1);
		}

		//	We need to serve from the common ancestor of:
		//	* the suite
		//	* the launching page
		//	* the SLIME installation that will load the page and run it

		if (parameters.options.definition && !parameters.options.suite) {
			parameters.options.suite = jsh.script.file.parent.getRelativePath("definition.suite.js");
		}

		var toSuite = jsh.file.navigate({
			from: jsh.shell.jsh.src.getFile("loader/browser/test/suite.js"),
			to: parameters.options.suite.file,
			base: (parameters.options.base) ? parameters.options.base.directory : void(0)
		});

		var testBase = toSuite.base;

		if (parameters.options.definition) {
			if (!parameters.options.definition.file) {
				jsh.shell.console("File not found: " + parameters.options.definition);
				jsh.shell.exit(1);
			}
			var toDefinition = jsh.file.navigate({
				from: testBase,
				to: parameters.options.definition.file
			});
			testBase = toDefinition.base;
		}

		var toShell = jsh.file.navigate({
			from: testBase,
			to: jsh.shell.jsh.src
		});

		var toResult = jsh.file.navigate({
			from: toShell.base,
			to: jsh.shell.jsh.src.getFile("loader/browser/test/suite.js"),
		});

		var toSuiteHtml = jsh.file.navigate({
			from: toResult.base,
			to: jsh.shell.jsh.src.getRelativePath("loader/browser/test/suite.html")
		});

		var url = toResult.relative.replace(/suite\.js/g, "result");

		// TODO: automated test cases for this script. Manual test cases for now:
		// rhino/jrunscript/api.js
		// loader/browser/test/test/sample.suite.js
		// $HOME/.bash_profile

		var tomcat = jsh.httpd.Tomcat();

		var library = {
			server: jsh.$fifty.browser.test.server
		}

		/**
		 *
		 * @param { slime.runtime.browser.test.internal.suite.Browser } browser
		 * @returns { slime.runtime.browser.test.internal.suite.Host }
		 */
		var run = function(browser) {
			library.server.start({
				tomcat: tomcat,
				resources: toShell.base,
				serve: toShell.base,
				resultsPath: url
			});
			jsh.shell.console("port = " + tomcat.port);
			jsh.shell.console("path = " + url);
			var command = (parameters.options.interactive) ? "" : "&command=run";
			jsh.java.Thread.start(function() {
				// TODO: query string by string concatenation is sloppy
				var uri = "http://127.0.0.1:" + tomcat.port + "/" + toSuiteHtml.relative + "?suite=" + toSuite.relative + command;
				if (parameters.options.definition) {
					var toDefinition = jsh.file.navigate({
						from: parameters.options.suite.file,
						to: parameters.options.definition.file
					});
					uri += "&definition=" + toDefinition.relative
				}
				if (parameters.options.part) {
					uri += "&part=" + parameters.options.part;
				}
				parameters.options.parameter.forEach(function(argument) {
					//	TODO	url-encode the below
					uri += "&" + argument;
				});
				try {
					browser.start({
						uri: uri
					});
				} catch (e) {
					jsh.shell.console(e);
					if (e.javaException) e.javaException.printStackTrace();
				}
			});
			return {
				port: tomcat.port
			};
		};

		var Browser = function(o) {
			var process;

			if (!o.open) {
				throw new Error("keys = " + Object.keys(o));
			}
			var open = o.open({
				start: function(p) {
					process = p;
				}
			});

			this.name = void(0);

			this.start = function(p) {
				open(p.uri);
			};

			this.kill = function() {
				jsh.shell.console("Killing " + o);
				process.kill();
			}
		};

		/**
		 * The `jsh.unit` module provides a set of browser implementations to drive Fifty testing. The JSAPI browser APIs are
		 * slightly different than the Fifty APIs, so this function adapts a Fifty testing browser to a JSAPI testing browser.
		 *
		 * @param { slime.jsh.unit.Browser } browser
		 * @param { (url: string) => string } url
		 * @returns { slime.runtime.browser.test.internal.suite.Browser }
		 */
		var jshUnitBrowserToBrowser = function(name, url, browser) {
			return {
				name: name,
				start: function(p) {
					browser.open({
						uri: url(p.uri)
					});
				},
				kill: function() {
					browser.close();
				}
			}
		}

		/**
		 *
		 * @param { string } argument
		 * @returns { slime.runtime.browser.test.internal.suite.Browser }
		 */
		var toBrowser = function(argument) {
			if (argument == "dockercompose:selenium:chrome") {
				return jshUnitBrowserToBrowser(
					"Remote (Selenium Chrome) - slime",
					function(url) { return url.replace(/127\.0\.0\.1/g, jsh.shell.environment.HOSTNAME) },
					jsh.unit.browser.selenium.remote.Chrome({
						host: "chrome",
						port: 4444
					})
				);
			}
			if (argument == "dockercompose:selenium:firefox") {
				return jshUnitBrowserToBrowser(
					"Remote (Selenium Firefox) - slime",
					function(url) { return url.replace(/127\.0\.0\.1/g, jsh.shell.environment.HOSTNAME) },
					jsh.unit.browser.selenium.remote.Firefox({
						host: "firefox",
						port: 4444
					})
				);
			}
			if (argument == "docker:selenium:chrome") {
				return jshUnitBrowserToBrowser(
					"Remote (Selenium Chrome) - local",
					function(url) { return url.replace(/127\.0\.0\.1/g, "host.docker.internal") },
					jsh.unit.browser.selenium.remote.Chrome({
						host: "localhost",
						port: 4444
					})
				)
			}
			if (argument == "selenium:chrome") {
				return jshUnitBrowserToBrowser(
					"Chrome (Selenium)",
					$api.fp.identity,
					jsh.unit.browser.selenium.Chrome()
				);
			}
			if (argument == "chrome") {
				var port = (function() {
					if (parameters.options["chrome:debug:port"]) return parameters.options["chrome:debug:port"];
					if (parameters.options["chrome:debug:vscode"]) return 9222;
				})();
				var instance = (parameters.options["chrome:instance"]) || jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
				return jshUnitBrowserToBrowser(
					"Chrome",
					$api.fp.identity,
					jsh.unit.browser.local.Chrome({
						program: jsh.shell.browser.installed.chrome.program,
						user: instance.toString(),
						debugPort: port,
						devtools: false
					})
				)
			}
			if (argument == "firefox") {
				return jshUnitBrowserToBrowser(
					"Firefox",
					$api.fp.identity,
					jsh.unit.browser.local.Firefox({
						//	TODO	push knowledge of these locations back into rhino/shell
						program: "/Applications/Firefox.app/Contents/MacOS/firefox"
						//	Linux: /usr/bin/firefox
					})
				)
			}
			var browsers = ["IE","Safari"];
			for (var i=0; i<browsers.length; i++) {
				if (argument == browsers[i].toLowerCase()) {
					var rv = new Browser(jsh.unit.browser.installed[argument].delegate);
					rv.name = browsers[i];
					return rv;
				}
			}
		};

		var browser = toBrowser(parameters.options.browser);

		if (parameters.options.interactive) {
			run(browser);
		} else {
			var suite = new jsh.unit.Suite();
			jsh.shell.console("Requesting result.");
			var running = run(browser);
			/** @type { { events: any[] } } */
			var result = new jsh.http.Client().request({
				url: "http://127.0.0.1:" + running.port + "/" + url,
				evaluate: function(response) {
					var string = response.body.stream.character().asString();
					var json = JSON.parse(string);
					return json;
				}
			});
			var scenario = {
				name: browser.name,
				execute: function(scope,verify) {
					result.events.forEach(function(event) {
						// TODO: there is no documentation that verify.fire works and it is not obvious why it does
						verify.fire(event.type,event.detail);
					});
				}
			}
			suite.part(browser.name, scenario);
			browser.kill();
			jsh.unit.interface.create(suite, {
				view: parameters.options.view
			});
		}
	}
//@ts-ignore
)(Packages, $api, jsh);
