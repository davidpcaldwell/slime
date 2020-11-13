//@ts-check
(
	/**
	 *
	 * @param { jsh } jsh
	 */
	function(jsh) {
		$api.Function.pipe(
			jsh.wf.cli.$f.option.boolean({ longname: "interactive" }),
			jsh.wf.cli.$f.option.pathname({ longname: "chrome:data" }),
			function(p) {
				var page = jsh.script.file.parent.getFile("test-browser.html");
				var client = jsh.shell.jsh.src.getFile("loader/browser/client.js");

				var path = p.arguments.shift();
				var target = jsh.script.getopts.parser.Pathname(path);

				var paths = (function() {
					var clientToShell = jsh.file.navigate({
						from: client,
						to: jsh.shell.jsh.src
					});

					var toResult = jsh.file.navigate({
						from: clientToShell.base,
						to: target.file
					});

					var toPage = jsh.file.navigate({
						from: toResult.base,
						to: page
					});

					var toFile = jsh.file.navigate({
						from: page,
						to: target.file
					});

					return {
						toShell: clientToShell,
						toResult: toResult,
						toPage: toPage,
						toFile: toFile
					};
				})();

				var loader = new jsh.file.Loader({ directory: jsh.shell.jsh.src });

				var code = {
					server: loader.factory("loader/browser/test/server.js")
				};

				var start = code.server();

				var resultsPath = (p.options.interactive) ? void(0) : (function() {
					var tokens = paths.toPage.relative.split("/");
					tokens[tokens.length-1] = "result";
					return tokens.join("/");
				})();

				jsh.shell.console("resultsPath = " + resultsPath);

				var tomcat = start(paths.toShell.base, paths.toResult.base, resultsPath);

				var chrome = new jsh.shell.browser.chrome.Instance({
					location: p.options["chrome:data"]
				});

				/** @type { { kill: any } } */
				var process;

				var run = function() {
					chrome.run({
						//	TODO	enhance chrome.run so it can take a Url object rather than just a string
						uri: new jsh.js.web.Url({
							scheme: "http",
							authority: {
								host: "127.0.0.1",
								port: tomcat.port
							},
							path: "/" + paths.toPage.relative,
							query: [
								{ name: "file", value: paths.toFile.relative },
								{ name: "results", value: String(Boolean(resultsPath)) }
							]
						}).toString(),
						on: {
							start: function(p) {
								process = p;
							}
						}
					});
				};

				if (p.options.interactive) {
					run();
				} else {
					jsh.shell.console("Unimplemented: non-interactive");
					jsh.java.Thread.start(run);
					var resultsUrl = new jsh.js.web.Url({
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
					process.kill();
					var status = (response) ? 0 : 1;
					jsh.shell.console("Exiting with status " + status);
					jsh.shell.exit(status);
				}

				//	TODO	make it possible to retrieve results of the tests; probably need to start browser in thread
			}
		)({ options: {}, arguments: jsh.script.arguments })
	}
//@ts-ignore
)(jsh);
