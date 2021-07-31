//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

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
			www.addHttpsHost("raw.githubusercontent.com");
			www.addHttpsHost("api.github.com");
			www.addHttpsHost("github.com");
			www.addHttpsHost("127.0.0.1");
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

			var zip = mock.request({
				url: "https://github.com/davidpcaldwell/slime/archive/refs/heads/master.zip"
			});
			fifty.verify(zip).status.code.is(200);
			fifty.verify(zip).body.type.media.is("application");
			fifty.verify(zip).body.type.subtype.is("zip");
			var buffers = {};
			var contents = fifty.global.jsh.io.archive.zip.decode({
				stream: zip.body.stream,
				output: {
					file: function(p) {
						buffers[p.path] = new fifty.global.jsh.io.Buffer();
						return buffers[p.path].writeBinary();
					},
					directory: function(p) {
						fifty.global.jsh.shell.console("Creating directory: " + p.path);
					}
				}
			});
			var jshBash = buffers["slime-master/jsh.bash"];
			fifty.verify(jshBash).is.type("object");
			fifty.verify(buffers["slime-master/foo.bash"]).is(void(0));
			fifty.verify(buffers["slime-master/jsh/loader/nashorn.js"]).is.type("object");
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
			fifty.run(fifty.tests.mock);
			fifty.run(file(real));
			fifty.run(file(mock));
		}
	}
//@ts-ignore
)(fifty);
