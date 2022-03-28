//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
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
						uri: getUrl({
							part: p.part,
							delay: p.delay,
							host: p.host,
							port: p.port,
							paths: {
								toHtmlRunner: p.paths.toHtmlRunner,
								toFile: p.paths.toFile,
								results: p.paths.results
							}
						}).toString(),
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
		}

		$api.Function.pipe(
			//	Keeps the browser open after running the tests so that they can be re-run by refreshing the page
			jsh.script.cli.option.boolean({ longname: "interactive" }),

			//	Selects a location to use for Google Chrome configuration; if unspecified, a temporary directory will be used
			jsh.script.cli.option.pathname({ longname: "chrome:data" }),

			//	Configures the browser to allow remote debugging connections on the SLIME Visual Studio Code debugger port
			jsh.script.cli.option.boolean({ longname: "chrome:debug:vscode" }),

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

				var browser = Chrome({
					location: p.options["chrome:data"],
					devtools: p.options["debug:devtools"],
					debugPort: (p.options["chrome:debug:vscode"]) ? 9222 : void(0)
				});

				/** @type { Parameters<slime.fifty.browser.test.internal.script.Browser["open"]>[0] } */
				var argument = {
					host: "127.0.0.1",
					port: tomcat.port,
					paths: {
						toHtmlRunner: paths.toHtmlRunner.relative,
						toFile: paths.toFile.relative,
						results: resultsPath
					},
					delay: void(0),
					part: p.options.part
				};

				if (p.options.interactive) {
					browser.open(argument);
				} else {
					var delay = (typeof(p.options["debug:delay"]) == "number") ? p.options["debug:delay"] : 4000;
					jsh.java.Thread.start(function() {
						browser.open(
							$api.Object.compose(
								argument,
								{ delay: delay }
							)
						)
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
)($api,jsh);
