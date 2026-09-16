//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		jsh.shell.console("Requiring Tomcat ...");
		var start = jsh.time.Value.now();
		jsh.shell.tools.tomcat.jsh.require.simple();
		var end = jsh.time.Value.now();
		jsh.shell.console("Requiring Tomcat took " + ((end-start)/1000).toFixed(3) + " seconds.");
		jsh.shell.console("Creating Tomcat ...");
		var tomcat = jsh.httpd.tomcat.Server.from.configuration({
			servlet: {
				load: function(scope) {
					scope.$exports.handle = function(request) {
						try {
							return {
								status: { code: 200 },
								body: {
									type: "application/json",
									string: JSON.stringify({
										method: request.method,
										path: request.path,
										java: jsh.shell.properties.get("java.version"),
										//	TODO	make this an official part of the servlet request
										tomcat: String(request["java"].adapt().getServletContext().getServerInfo())
										//tomcatp: jsh.shell.properties.get("org.apache.catalina.startup.Catalina.VERSION")//,
										//tomcatv: String(Packages.org.apache.catalina.startup.Catalina.VERSION)
									})
								}
							};
						} catch (e) {
							jsh.shell.console(e);
							jsh.shell.console(e.stack);
						}
					}
				}
			}
		});

		jsh.shell.console("Starting Tomcat ...");
		tomcat.start();

		var client = jsh.http.World.question(jsh.http.Implementation.from.java.urlconnection);
		var mapping = $api.fp.now(client, $api.fp.world.Sensor.mapping());
		jsh.shell.console("Making request ...");
		var answer = mapping({
			url: "http://127.0.0.1:" + tomcat.port + "/foo"
		});
		var string = answer.stream.read.string.simple($api.jrunscript.io.Charset.default);
		//jsh.shell.console(string);
		jsh.shell.echo(JSON.stringify({
			status: answer.status,
			headers: answer.headers,
			body: JSON.parse(string)
		},void(0),4));
		tomcat.stop();
	}
//@ts-ignore
)(Packages,$api,jsh);
