//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.script.cli.main } main
	 */
	function(Packages,$api,jsh,main) {
		main(
			function() {
				var tomcat = jsh.httpd.Tomcat();
				tomcat.servlet({
					load: function(scope) {
						scope.$exports.handle = function(request) {
							debugger;
							return {
								status: { code: 200 },
								body: {
									type: "text/plain",
									string: JSON.stringify({
										method: request.method,
										path: request.path
									})
								}
							}
						}
					}
				});
				tomcat.start();
				jsh.shell.console("Tomcat started on port " + tomcat.port);
				jsh.shell.console("http://127.0.0.1:" + tomcat.port + "/");
				jsh.java.Thread.start(function() {
					tomcat.run();
				});
				jsh.java.Thread.start(function() {
					Packages.java.lang.Thread.sleep(10000);
					tomcat.stop();
				})
			}
		)
	}
//@ts-ignore
)(Packages,$api,jsh,main);
