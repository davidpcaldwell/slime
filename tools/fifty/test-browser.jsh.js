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
	function(Packages,$api,jsh) {
		jsh.shell.tools.tomcat.require();

		/**
		 *
		 * @param { { part: string, delay: number, host: string, port: number, paths: { toHtmlRunner: string, toFile: string, results: string } }} p
		 * @returns { slime.web.object.Url }
		 */
		var getUrl = function(p) {
			return new jsh.web.Url({
				scheme: "http",
				authority: {
					host: p.host,
					port: p.port
				},
				path: "/" + p.paths.toHtmlRunner,
				query: $api.Array.build(function(rv) {
					rv.push({ name: "file", value: p.paths.toFile });
					rv.push({ name: "results", value: String(Boolean(p.paths.results)) });
					if (p.part) {
						rv.push({ name: "part", value: p.part });
					}
					if (p.delay) {
						rv.push({ name: "delay", value: String(p.delay) });
					}
				})
			});
		};

		/**
		 *
		 * @param { slime.fifty.browser.test.internal.script.Chrome } configuration
		 * @returns { slime.fifty.browser.test.internal.script.Browser }
		 */
		var Chrome = function(configuration) {
			var chrome = new jsh.shell.browser.chrome.Instance({
				location: configuration.location,
				devtools: configuration.devtools
			});
			/** @type { { kill: any } } */
			var process;
			return {
				open: function(p) {
					chrome.run({
						//	TODO	enhance chrome.run so it can take a Url object rather than just a string
						uri: p.uri,
						arguments: (configuration.debugPort) ? ["--remote-debugging-port=" + configuration.debugPort ] : [],
						on: {
							start: function(p) {
								process = p;
							}
						}
					});
				},
				close: function() {
					process.kill();
				}
			}
		};

		/**
		 *
		 * @param { slime.fifty.browser.test.internal.script.SeleniumChrome } [configuration]
		 * @returns { slime.fifty.browser.test.internal.script.Browser }
		 */
		var SeleniumChrome = function(configuration) {
			jsh.shell.tools.selenium.load();
			var _driver;
			return {
				open: function(p) {
					var _options = new Packages.org.openqa.selenium.chrome.ChromeOptions();
					_driver = new Packages.org.openqa.selenium.chrome.ChromeDriver(_options);
					_driver.get(p.uri);
				},
				close: function() {
					_driver.quit();
				}
			}
		};

		/**
		 *
		 * @param { slime.fifty.browser.test.internal.script.RemoteSelenium } configuration
		 * @returns { slime.fifty.browser.test.internal.script.Browser }
		 */
		var RemoteSelenium = function(configuration) {
			jsh.shell.tools.selenium.load();
			var _driver;
			return {
				open: function(p) {
					//	TODO	extend Properties to properly include superclass methods?
					//	TODO	remove need for the property manipulation by patching Selenium or transferring these global
					//			properties to be in the inonit.script.jsh.Main Java class itself; would they be available where
					//			needed?
					/** @type { any } */
					var _properties = Packages.java.lang.System.getProperties();
					var saved = {};
					var streams = ["stdin", "stdout", "stderr"];
					streams.forEach(function(name) {
						saved[name] = _properties.get("inonit.script.jsh.Main." + name);
						_properties.remove("inonit.script.jsh.Main." + name);
					});
					var _options = new Packages.org.openqa.selenium.chrome.ChromeOptions();
					_driver = new Packages.org.openqa.selenium.remote.RemoteWebDriver(
						new Packages.java.net.URL("http://" + configuration.browser.host + ":" + configuration.browser.port + "/wd/hub"),
						_options
					);
					streams.forEach(function(name) {
						_properties.put("inonit.script.jsh.Main." + name, saved[name]);
					})
					_driver.get(p.uri);
				},
				close: function() {
					_driver.quit();
				}
			}
		}

		$api.Function.pipe(
			//	Keeps the browser open after running the tests so that they can be re-run by refreshing the page
			jsh.script.cli.option.boolean({ longname: "interactive" }),

			jsh.script.cli.option.string({ longname: "browser", default: "chrome" }),

			$api.Function.pipe(
				//	Selects a location to use for Google Chrome configuration; if unspecified, a temporary directory will be used
				jsh.script.cli.option.pathname({ longname: "chrome:data" }),

				//	Configures the browser to allow remote debugging connections on the SLIME Visual Studio Code debugger port
				jsh.script.cli.option.boolean({ longname: "chrome:debug:vscode" })
			),

			//	Selects a part of the test suite to run; default is to run the entire suite
			jsh.script.cli.option.string({ longname: "part" }),

			jsh.script.cli.option.pathname({ longname: "base" }),

			$api.Function.pipe(
				//	See https://github.com/davidpcaldwell/slime/issues/317
				jsh.script.cli.option.number({ longname: "debug:delay" }),
				jsh.script.cli.option.boolean({ longname: "debug:devtools" })
			),

			function(p) {
				var page = jsh.script.file.parent.getFile("test-browser.html");
				var client = jsh.shell.jsh.src.getFile("loader/browser/client.js");

				var path = p.arguments.shift();
				var target = jsh.script.getopts.parser.Pathname(path);

				if (!target.file) throw new Error("File not found: " + target);

				var base = (p.options.base) ? p.options.base.directory : void(0);

				var paths = (function() {
					var clientToShell = jsh.file.navigate({
						from: client,
						to: jsh.shell.jsh.src,
						base: base
					});

					var toResult = jsh.file.navigate({
						from: clientToShell.base,
						to: target.file,
						base: base
					});

					var toHtmlRunner = jsh.file.navigate({
						from: toResult.base,
						to: page,
						base: base
					});

					var toFile = jsh.file.navigate({
						from: page,
						to: target.file,
						base: base
					});

					return {
						toShell: clientToShell,
						toResult: toResult,
						toHtmlRunner: toHtmlRunner,
						toFile: toFile
					};
				})();

				var loader = new jsh.file.Loader({ directory: jsh.shell.jsh.src });

				var code = {
					/** @type { slime.runtime.browser.test.server.Script } */
					server: loader.script("loader/browser/test/server.js")
				};

				var start = code.server();

				var resultsPath = (p.options.interactive) ? void(0) : (function() {
					var tokens = paths.toHtmlRunner.relative.split("/");
					tokens[tokens.length-1] = "result";
					return tokens.join("/");
				})();

				var tomcat = start(paths.toShell.base, paths.toResult.base, resultsPath);

				var host = (function() {
					if (p.options.browser == "dockercompose:selenium:chrome") {
						return "slime";
					}
					return "127.0.0.1";
				})();

				var browser = (function() {
					if (p.options.browser == "chrome") {
						return Chrome({
							location: p.options["chrome:data"],
							devtools: p.options["debug:devtools"],
							debugPort: (p.options["chrome:debug:vscode"]) ? 9222 : void(0)
						});
					} else if (p.options.browser == "selenium:chrome") {
						return SeleniumChrome();
					} else if (p.options.browser == "dockercompose:selenium:chrome") {
						return RemoteSelenium({
							browser: {
								host: "chrome",
								port: 4444
							}
						})
					}
				})();

				var getUri = function(host,delay) {
					return jsh.web.Url.codec.string.encode(getUrl({
						host: host,
						port: tomcat.port,
						paths: {
							toHtmlRunner: paths.toHtmlRunner.relative,
							toFile: paths.toFile.relative,
							results: resultsPath
						},
						delay: delay,
						part: p.options.part
					}));
				}

				if (p.options.interactive) {
					browser.open({
						uri: getUri(host)
					});
				} else {
					var delay = (typeof(p.options["debug:delay"]) == "number") ? p.options["debug:delay"] : 4000;
					jsh.java.Thread.start(function() {
						browser.open({
							uri: getUri(host,delay)
						});
					});
					var resultsUrl = new jsh.web.Url({
						scheme: "http",
						authority: {
							host: "127.0.0.1",
							port: tomcat.port
						},
						path: "/" + resultsPath
					});

					jsh.shell.console("Getting response from " + resultsUrl.toString());

					var response = new jsh.http.Client().request({
						url: resultsUrl.toString(),
						evaluate: function(response) {
							var json = response.body.stream.character().asString();
							return JSON.parse(json);
						}
					});
					jsh.shell.console("response = " + response);
					jsh.shell.console("Killing browser ...");
					browser.close();
					//	TODO	make it possible to retrieve results of the tests to be consumed by JSAPI?
					var status = (response) ? 0 : 1;
					jsh.shell.console("Exiting with status " + status);
					jsh.shell.exit(status);
				}
			}
		)({
			options: {},
			arguments: jsh.script.arguments
		})
	}
//@ts-ignore
)(Packages,$api,jsh);
