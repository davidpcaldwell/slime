//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		//	TODO	allow system property in addition to environment variable?
		return jsh.java && jsh.shell && jsh.file && (typeof(jsh.shell.environment.CATALINA_HOME) == "string" || typeof(Packages.org.apache.catalina.startup.Tomcat) == "function");
	},
	disabled: function() {
		return "Environment variable CATALINA_HOME is not defined.";
	},
	load: function() {
		if (jsh.shell.environment.CATALINA_HOME) {
			var CATALINA_HOME = jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;

			if (CATALINA_HOME) {
				[
					"bin/tomcat-juli.jar", "lib/servlet-api.jar", "lib/tomcat-util.jar", "lib/tomcat-api.jar", "lib/tomcat-coyote.jar",
					"lib/catalina.jar"
				].forEach(function(path) {
					$loader.classpath.add(CATALINA_HOME.getRelativePath(path));
				});
			}
		}

		if (!jsh.httpd) {
			jsh.httpd = {};
		}

		var getMimeType = function(file) {
			var type = jsh.io.mime.Type.guess({
				name: file.pathname.basename
			});
			if (!type && /\.js$/.test(file.pathname.basename)) {
				type = new jsh.io.mime.Type("text", "javascript");
			}
			return type;
		}

		$loader.file("resources.jsh.file.js", {
			getMimeType: getMimeType
		}).addJshPluginTo(jsh);

		jsh.httpd.Tomcat = function(p) {
			var tomcat = new Packages.org.apache.catalina.startup.Tomcat();

			var base = (p.base) ? p.base : jsh.shell.TMPDIR.createTemporary({ directory: true, prefix: "tomcat" });

			this.base = base;

			var port = (p.port) ? p.port : (function() {
				var address = new Packages.java.net.ServerSocket(0);
				var rv = address.getLocalPort();
				address.close();
				return rv;
			})();

			this.port = port;

			tomcat.setBaseDir(base);
			tomcat.setPort(port);

			var server = $loader.file("server.js", {
				api: {
					io: jsh.io
				}
			});

			this.map = function(m) {
				if (typeof(m.path) == "string" && m.servlets) {
					var context = tomcat.addContext(m.path, base.pathname.java.adapt().getCanonicalPath());
					var id = 0;
					for (var pattern in m.servlets) {
						//	TODO	below may not work if more than one servlet; value changes during loop and may be picked up
						//			by servlets earlier in loop
						var servletDeclaration = m.servlets[pattern];
						if (!servletDeclaration.file) {
							throw new Error("Incorrect launch.");
						}
						var servletName = "slime" + String(id++);
						var servlet = Packages.org.apache.catalina.startup.Tomcat.addServlet(context,servletName,new JavaAdapter(
							Packages.javax.servlet.http.HttpServlet,
							new function() {
								//	TODO	could use jsh.io here
								var servlet;

								this.init = function() {
									var apiScope = {
										$host: new function() {
											this.parameters = (servletDeclaration.parameters) ? servletDeclaration.parameters : {};

											this.loaders = {
												script: new jsh.file.Loader({
													directory: servletDeclaration.file.parent,
													type: getMimeType
												}),
												container: (m.resources) ? m.resources.loader : null
											};

											this.getCode = function(scope) {
												jsh.loader.run(servletDeclaration.file.pathname, scope);
											}

											this.$exports = {};
											this.server = server;
											this.api = {
												js: jsh.js,
												java: jsh.java,
												io: jsh.io
											}
										}
									};
									//	TODO	use $host and $loader.run, but that is not currently implemented; when it is, switch this
									//			if (false) and delete the $context/$host rigamarole at the top of api.js
									$loader.run("api.js", apiScope);
									servlet = apiScope.$host.$exports.servlet;
								};

								this.service = function(_request,_response) {
									servlet.service(_request,_response);
								}

								this.destroy = function() {
									servlet.destroy();
								}
							}
						));
						context.addServletMapping(pattern,servletName);
					}
				} else if (typeof(m.path) == "string" && m.webapp) {
					throw new Error("Currently does not work, apparently, due to issues with ClassLoaders");
					var context = tomcat.addWebapp(m.path, m.webapp.java.adapt().getCanonicalPath());
					jsh.shell.echo("Added " + context);
				}
			}

			//	TODO	are both start() and run() needed?

			var started = false;

			this.start = function() {
				if (!started) {
					tomcat.start();
					started = true;
				}
			}

			this.run = function() {
				if (!started) {
					tomcat.start();
					started = true;
				}
				var run = function() {
					tomcat.getServer().await();
					started = false;
				};
				var fork = false;
				if (fork) {
					jsh.java.Thread.start({ call: run });
				} else {
					run();
				}
			}

			this.stop = function() {
				tomcat.stop();
				started = false;
			}
		}
	}
});