//@ts-check
(
	/**
	 *
	 * @param { jsh } jsh
	 */
	function(jsh) {
		$api.Function.pipe(
			function(p) {
				jsh.shell.console("Fifty! " + JSON.stringify(p.arguments));

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

				jsh.shell.console("resources = " + paths.toShell.base);

				jsh.shell.console("serve = " + paths.toResult.base);

				jsh.shell.console("path = " + paths.toPage.relative);

				var loader = new jsh.file.Loader({ directory: jsh.shell.jsh.src });
				var code = {
					server: loader.factory("loader/browser/test/server.js")
				};

				var start = code.server();

				var tomcat = start(paths.toShell.base, paths.toResult.base);

				var chrome = new jsh.shell.browser.chrome.Instance({
					location: jsh.shell.jsh.src.getRelativePath("local/chrome/fifty")
				});

				chrome.run({
					uri: new jsh.js.web.Url({
						scheme: "http",
						authority: {
							host: "127.0.0.1",
							port: tomcat.port
						},
						path: "/" + paths.toPage.relative,
						query: [
							{ name: "file", value: paths.toFile.relative }
						]
					}).toString()
				});
			}
		)({ options: {}, arguments: jsh.script.arguments })
	}
//@ts-ignore
)(jsh);
