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
		jsh.wf.typescript.require();

		jsh.shell.tools.tomcat.old.require();

		/**
		 *
		 * @param { { part: string, delay: number, host: string, port: number, paths: { toHtmlRunner: string, toFile: string, results: string } }} p
		 * @returns { slime.web.Url }
		 */
		var createUrlForTestExecution = function(p) {
			return {
				scheme: "http",
				host: p.host,
				port: p.port,
				path: "/" + p.paths.toHtmlRunner,
				query: jsh.web.Url.query(
					$api.Array.build(function(rv) {
						rv.push({ name: "file", value: p.paths.toFile });
						rv.push({ name: "results", value: String(Boolean(p.paths.results)) });
						if (p.part) {
							rv.push({ name: "part", value: p.part });
						}
						if (p.delay) {
							rv.push({ name: "delay", value: String(p.delay) });
						}
					})
				)
			};
		};

		$api.fp.pipe(
			//	Keeps the browser open after running the tests so that they can be re-run by refreshing the page
			jsh.script.cli.option.boolean({ longname: "interactive" }),

			jsh.script.cli.option.string({ longname: "browser", default: "chrome" }),

			$api.fp.pipe(
				//	Selects a location to use for Google Chrome configuration; if unspecified, a temporary directory will be used
				jsh.script.cli.option.pathname({ longname: "chrome:data" }),

				//	Configures the browser to allow remote debugging connections on the SLIME Visual Studio Code debugger port
				jsh.script.cli.option.boolean({ longname: "chrome:debug:vscode" })
			),

			//	Selects a part of the test suite to run; default is to run the entire suite
			jsh.script.cli.option.string({ longname: "part" }),

			jsh.script.cli.option.pathname({ longname: "base" }),

			$api.fp.pipe(
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

				var start = jsh.$fifty.browser.test.server.create;

				var resultsPath = (p.options.interactive) ? void(0) : (function() {
					var tokens = paths.toHtmlRunner.relative.split("/");
					tokens[tokens.length-1] = "result";
					return tokens.join("/");
				})();

				var tomcat = start(paths.toShell.base, paths.toResult.base, resultsPath);

				var host = (function() {
					if (p.options.browser == "dockercompose:selenium:chrome" || p.options.browser == "dockercompose:selenium:firefox") {
						return jsh.shell.environment.HOSTNAME;
					}
					return "127.0.0.1";
				})();

				try {
					var browser = (function() {
						if (p.options.browser == "chrome") {
							var user = (p.options["chrome:data"]) ? p.options["chrome:data"] : jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
							var debugPort = (p.options["chrome:debug:vscode"]) ? 9222 : void(0);
							if (debugPort) {
								var available = $api.fp.world.now.question(
									jsh.ip.world.tcp.isAvailable,
									{
										port: {
											number: debugPort
										}
									}
								);
								if (!available) {
									jsh.shell.console("Could not open debug port " + debugPort + "; exiting.");
									jsh.shell.exit(1);
								}
							}
							if (jsh.shell.browser.installed.chrome) {
								return jsh.unit.browser.local.Chrome({
									program: jsh.shell.browser.installed.chrome.program,
									user: user.toString(),
									devtools: p.options["debug:devtools"],
									debugPort: debugPort
								});
							} else {
								throw new Error("Chrome not installed; cannot run Chrome browser tests.");
							}
						} else if (p.options.browser == "firefox") {
							return jsh.unit.browser.local.Firefox({
								//	TODO	push knowledge of these locations back into rhino/shell
								program: "/Applications/Firefox.app/Contents/MacOS/firefox"
								//	Linux: /usr/bin/firefox
							});
						} else if (p.options.browser == "safari") {
							return jsh.unit.browser.local.Safari();
						} else if (p.options.browser == "selenium:chrome") {
							return jsh.unit.browser.selenium.Chrome()
						} else if (p.options.browser == "dockercompose:selenium:chrome") {
							return jsh.unit.browser.selenium.remote.Chrome({
								host: "chrome",
								port: 4444
							})
						} else if (p.options.browser == "dockercompose:selenium:firefox") {
							return jsh.unit.browser.selenium.remote.Firefox({
								host: "firefox",
								port: 4444
							})
						} else {
							throw new TypeError("Browser not found: " + p.options.browser);
						}
					})();
				} catch (e) {
					jsh.shell.console(e.message);
					jsh.shell.exit(1);
				}

				/**
				 *
				 * @param { string } host The hostname to use when requesting the test page
				 * @param { number } [delay] An optional delay, in milliseconds, after which the tests should start running. This
				 * is used to work around an unknown problem.
				 * @returns { string } A URI to open to run tests.
				 */
				var getUri = function(host,delay) {
					return jsh.web.Url.codec.string.encode(createUrlForTestExecution({
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
					var uri = getUri(host, delay);
					jsh.shell.console("Browser opening " + uri + " ...");
					browser.open({
						uri: uri
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
