//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		jsh.script.cli.wrap({
			commands: {
				test: function() {
					var loader = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent });
					var web = new jsh.unit.mock.Web({ trace: true });
					web.add(loader.module("test/mock-echo-handler.js"));
					web.start();
					var client = web.client;
					var response = client.request({
						url: "http://mockweb.slime.com/foo-bar-baz"
					});
					jsh.shell.console(response.body.stream.character().asString());
				},
				serve: function() {
					var loader = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent });
					var web = new jsh.unit.mock.Web({ trace: true });
					web.add(loader.module("test/mock-echo-handler.js"));
					jsh.shell.console("HTTP port: " + web.port + " HTTPS port: " + web.https.port);
					web.run();
				}
			}
		});
	}
//@ts-ignore
)(jsh);
