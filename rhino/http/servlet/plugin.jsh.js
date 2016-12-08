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

//	TODO	clean up the plugin; rename plugin.jsh.api.html and include jsh.tomcat.js in this file or one with a better name
plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.java.log && jsh.io && jsh.io.mime && jsh.shell && jsh.file;
	},
	load: function() {
		if (!jsh.httpd) {
			jsh.httpd = {};
		}

		var getMimeType = function(file) {
			var type = jsh.io.mime.Type.guess({
				name: file.pathname.basename
			});
			if (!type && /\.js$/.test(file.pathname.basename)) {
				type = new jsh.io.mime.Type("application", "javascript");
			}
			return type;
		};

		jsh.httpd.nugget = {};
		jsh.httpd.nugget.getMimeType = getMimeType;

		jsh.httpd.spi = {};
		jsh.httpd.spi.argument = function(resources,servlet) {
			if (servlet.$loader) throw new Error("servlet.$loader provided");
			if (servlet.pathname && servlet.directory === false) {
				servlet = { file: servlet };
			}

			var byLoader = function($loader,path) {
				return function(scope) {
					$loader.run(path, scope);
				}
			};

			var getResourceLoader = function(resources) {
				if (!resources) return null;
				if (resources.get && resources.Child) return resources;
				if (resources.loader) return $api.deprecate(function() {
					return resources.loader;
				})();
			};

			resources = getResourceLoader(resources);

			var returning = function(o) {
				o.resources = resources;
				return o;
			};

			if (servlet.load) {
				return returning({
					$loader: servlet.$loader,
					load: servlet.load
				});
//			} else if (servlet.$loader && servlet.path) {
//				return returning({
//					$loader: servlet.$loader,
//					load: byLoader(servlet.$loader,servlet.path)
//				});
			} else if (servlet.file) {
				return returning({
					$loader: new jsh.file.Loader({
						directory: servlet.file.parent,
						type: getMimeType
					}),
					load: function(scope) {
						jsh.loader.run(servlet.file.pathname, scope);
					}
				});
			} else if (servlet.resource) {
				var prefix = servlet.resource.split("/").slice(0,-1).join("/");
				if (prefix) prefix += "/";
				var $loader = new resources.Child(prefix);
				return returning({
					$loader: $loader,
					load: byLoader($loader, servlet.resource.substring(prefix.length))
				});
			} else {
				throw new Error("Bad argument.");
			}
		};


		$loader.run("plugin.jsh.resources.js", {
			jsh: jsh,
			$context: {
				getMimeType: getMimeType
			}
		});

		var CATALINA_HOME = (function() {
			if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
			if (jsh.shell.jsh.lib && jsh.shell.jsh.lib.getSubdirectory("tomcat")) return jsh.shell.jsh.lib.getSubdirectory("tomcat");
		})();

		//	TODO	allow system property in addition to environment variable?
		var TOMCAT_CLASS = (function() {
			var TOMCAT_CLASS = jsh.java.getClass("org.apache.catalina.startup.Tomcat");
			if (!TOMCAT_CLASS && CATALINA_HOME) {
				[
					"bin/tomcat-juli.jar", "lib/servlet-api.jar", "lib/tomcat-util.jar", "lib/tomcat-api.jar", "lib/tomcat-coyote.jar",
					"lib/catalina.jar"
					,"lib/annotations-api.jar"
				].forEach(function(path) {
					jsh.loader.java.add(CATALINA_HOME.getRelativePath(path));
				});
				TOMCAT_CLASS = jsh.java.getClass("org.apache.catalina.startup.Tomcat");
			}
			return TOMCAT_CLASS;
		})();

		jsh.java.log.named("jsh.httpd").CONFIG("When trying to load Tomcat: class = %s CATALINA_HOME = %s", TOMCAT_CLASS, CATALINA_HOME);

		if (TOMCAT_CLASS) {
			jsh.httpd.Tomcat = function(p) {
				if (!p) p = {};
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

				var api = {
					js: jsh.js,
					java: jsh.java,
					io: jsh.io,
					web: jsh.js.web
				};
				var server = $loader.module("server.js", {
					api: api
				});

				this.map = function(m) {
					if (typeof(m.path) == "string" && m.servlets) {
						var context = tomcat.addContext(m.path, base.pathname.java.adapt().getCanonicalPath());
						var id = 0;
						for (var pattern in m.servlets) {
							//	TODO	below may not work if more than one servlet; value changes during loop and may be picked up
							//			by servlets earlier in loop
							var servletDeclaration = m.servlets[pattern];
							var servletImplementation = jsh.httpd.spi.argument(m.resources,servletDeclaration);
		//					if (!servletDeclaration.file) {
		//						throw new Error("Incorrect launch.");
		//					}
							var servletName = "slime" + String(id++);
							Packages.org.apache.catalina.startup.Tomcat.addServlet(context,servletName,new JavaAdapter(
								Packages.javax.servlet.http.HttpServlet,
								new function() {
									//	TODO	could use jsh.io here
									var servlet;

									this.init = function() {
										var apiScope = {
											$host: new function() {
												this.parameters = (servletDeclaration.parameters) ? servletDeclaration.parameters : {};

												this.loaders = {
													api: new $loader.Child("server/"),
													script: servletImplementation.$loader,
													container: servletImplementation.resources
												};

												this.getCode = function(scope) {
													servletImplementation.load(scope);
												}

												this.$java = $jsh;

												this.$exports = {};
												this.server = server;
												this.api = api;
											}
										};
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
						tomcat.getEngine().setParentClassLoader(tomcat.getEngine().getClass().getClassLoader());
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
			};

			jsh.httpd.Tomcat.serve = function(p) {
				var loader = new jsh.file.Loader({ directory: p.directory });
				var getMimeType = function(path) {
					return jsh.httpd.nugget.getMimeType(p.directory.getFile(path));
				}
				var tomcat = new jsh.httpd.Tomcat(p);
				tomcat.map({
					path: "",
					servlets: {
						"/*": {
							load: function(scope) {
								scope.$exports.handle = function(request) {
									var resource = loader.get(request.path);
									if (resource) {
										return {
											status: {
												code: 200
											},
											headers: [],
											body: {
												type: getMimeType(request.path),
												stream: resource.read(jsh.io.Streams.binary)
											}
										};
									} else {
										return {
											status: {
												code: 404
											}
										}
									}
								};
							}
						}
					}
				});
				tomcat.start();
				return tomcat;
			};
		}
	}
});