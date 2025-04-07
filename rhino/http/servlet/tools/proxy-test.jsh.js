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
		var underlying = jsh.httpd.tomcat.Server.from.configuration({
			resources: void(0),
			servlet: {
				load: function(scope) {
					scope.$exports.handle = function(request) {
						return {
							status: {
								code: 200
							},
							body: {
								type: "application/json",
								string: JSON.stringify({
									scheme: request.scheme,
									method: request.method,
									uri: request.uri,
									url: request.url,
									headers: request.headers
								}, void(0), 4)
							}
						};
					}
				}
			}
		});

		underlying.start();

		var direct = new jsh.http.Client().request({
			url: "http://127.0.0.1:" + underlying.port + "/test/path"
		});
		var directResponse = JSON.parse(direct.body.stream.character().asString());
		jsh.shell.console("DIRECT: " + JSON.stringify(directResponse));

		//	TODO	requiring this call seems dubious
		jsh.httpd.plugin.tools();

		//	TODO	is there a way to make this into an automated test? Right now we examine the UI after the line below executes.

		jsh.httpd.tools.proxy.application({
			hosts: ["destination.example.com"],
			delegate: {
				port: underlying.port
			},
			chrome: {
				location: jsh.script.file.parent.parent.parent.parent.parent.getRelativePath("local/chrome/https-proxy"),
				uri: "https://destination.example.com/test/path"
			}
		});
	}
//@ts-ignore
)($api,jsh);
