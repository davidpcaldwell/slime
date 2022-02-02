//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var underlying = new jsh.httpd.Tomcat();
		underlying.servlet({
			load: function(scope) {
				scope.$exports.handle = function(request) {
					return {
						status: {
							code: 200
						},
						body: {
							type: "application/json",
							string: JSON.stringify({
								method: request.method,
								uri: request.uri,
								url: request.url
							})
						}
					};
				}
			}
		});
		underlying.start();

		var direct = new jsh.http.Client().request({
			url: "http://127.0.0.1:" + underlying.port + "/test/path"
		});
		var directResponse = JSON.parse(direct.body.stream.character().asString());
		jsh.shell.console("DIRECT: " + JSON.stringify(directResponse));

		/** @type { slime.servlet.proxy.Script } */
		var script = jsh.script.loader.script("proxy.js");
		var api = script({
			library: {
				web: jsh.web,
				io: jsh.io,
				ip: jsh.ip,
				http: jsh.http,
				jsh: {
					shell: jsh.shell,
					httpd: jsh.httpd
				}
			}
		});

		var tomcat = api.create({
			hosts: ["127.0.0.1","destination.example.com"],
			server: {
				http: underlying.port
			}
		});
		jsh.shell.console("http: " + String(tomcat.port));
		jsh.shell.console("https: " + String(tomcat.https.port));

		jsh.java.Thread.start(function() {
			try {
				tomcat.run();
			} catch (e) {
				jsh.shell.console(e);
				jsh.shell.console(e.stack);
			}
		});

		var instance = new jsh.shell.browser.chrome.Instance({
			location: jsh.script.file.parent.parent.parent.parent.parent.getRelativePath("local/chrome/https-proxy"),
			hostrules: [
				"MAP destination.example.com 127.0.0.1:" + tomcat.https.port
			]
		});

		instance.run({
			uri: "https://destination.example.com/test/path"
		});
	}
//@ts-ignore
)($api,jsh);
