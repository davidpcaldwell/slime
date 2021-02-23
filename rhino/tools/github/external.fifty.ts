(
	function(
		fifty: slime.fifty.test.kit
	) {
		const real = (function() {
			var jsh = fifty.global.jsh;
			var auth = jsh.http.Authentication.Basic.Authorization({
				user: "davidpcaldwell",
				password: fifty.global.jsh.shell.properties.get("github.token")
			});
			return new jsh.http.Client({
				authorization: auth
			});
		})();

		const mock = (function() {
			const jsh = fifty.global.jsh;
			jsh.loader.plugins(jsh.shell.jsh.src.getSubdirectory("rhino/tools/github"));
			var www = new jsh.unit.mock.Web({ trace: true });
			www.add(jsh.unit.mock.Web.github({
				src: {
					davidpcaldwell: {
						slime: jsh.tools.git.Repository({ directory: jsh.shell.jsh.src })
					}
				}
			}));
			www.start();
			jsh.http.test.disableHttpsSecurity();
			return www.https.client;
		})();

		fifty.tests.mock = function() {
			fifty.global.jsh.loader.plugins(fifty.global.jsh.shell.jsh.src.getSubdirectory("rhino/tools/github"));
			const plugin = fifty.global.jsh.unit.mock.Web.github({
				src: {
					davidpcaldwell: {
						slime: fifty.global.jsh.tools.git.Repository({ directory: fifty.global.jsh.shell.jsh.src })
					}
				}
			});
			var type: string = typeof(plugin);
			fifty.verify(type).is("function");
		};

		var file = function(client: slime.jrunscript.http.client.Client) {
			return function() {
				var launcher = client.request({
					url: "https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash"
				});
				fifty.verify(launcher).status.code.is(200);
				fifty.verify(launcher).body.type.media.is("text");
				fifty.verify(launcher).body.type.subtype.is("plain");
				//fifty.global.jsh.shell.console(launcher.body.stream.character().asString());

				var sources = client.request({
					url: "https://api.github.com/repos/davidpcaldwell/slime/contents/loader/jrunscript/java/"
				});
				fifty.verify(sources).status.code.is(200);
				fifty.verify(sources).body.type.media.is("application");
				fifty.verify(sources).body.type.subtype.is("json");
				var json: any[] = JSON.parse(sources.body.stream.character().asString());
				fifty.verify(json).length.is(2);

				var plugins = client.request({
					url: "https://api.github.com/repos/davidpcaldwell/slime/contents/local/jsh/plugins/",
				});
				fifty.verify(plugins).status.code.is(404);
			};
		}

		fifty.tests.suite = function() {
			run(fifty.tests.mock);
			run(file(real));
			run(file(mock));
		}
	}
//@ts-ignore
)(fifty);
