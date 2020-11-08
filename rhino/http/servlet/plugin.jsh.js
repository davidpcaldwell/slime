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
//@ts-check
(
	/**
	 * @param { any } Packages
	 * @param { any } JavaAdapter
	 * @param { jsh.plugin.$slime } $slime
	 * @param { jsh } jsh
	 * @param { jsh.plugin.plugin } plugin
	 * @param { slime.Loader } $loader
	 */
	function(Packages,JavaAdapter,$slime,jsh,plugin,$loader) {
		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.java && jsh.java.log && jsh.io && jsh.io.mime && jsh.shell && jsh.file);
			},
			load: function() {
				if (!jsh.httpd) {
					jsh.httpd = {
						Resources: void(0),
						plugin: void(0),
						tools: void(0),
						nugget: void(0),
						spi: void(0)
					};
				}

				var keygen = function(p) {
					var pathname = jsh.shell.HOME.getRelativePath(".inonit/jsh/etc/keystore");
					if (!pathname.file) {
						pathname.parent.createDirectory({
							exists: function(dir) {
								return false;
							},
							recursive: true
						});
						if (!p) p = {};
						if (!p.dname) p.dname = {};
						//	"CN=Embedded Tomcat, OU=jsh, O=SLIME, L=Unknown, ST=Unknown, C=Unknown";
						if (!p.dname.cn) p.dname.cn = "Embedded Tomcat";
						if (!p.dname.ou) p.dname.ou = "jsh";
						if (!p.dname.o) p.dname.o = "SLIME";
						if (!p.dname.l) p.dname.l = "Unknown";
						if (!p.dname.st) p.dname.st = "Unknown";
						if (!p.dname.c) p.dname.c = "Unknown";
						var dname = ["cn","ou","o","l","st","c"].map(function(name) {
							return name.toUpperCase() + "=" + p.dname[name];
						}).join(", ");
						// jsh.shell.run({
						// 	command: jsh.shell.java.keytool,
						// 	arguments: [
						// 		"-genkey",
						// 		"-noprompt",
						// 		"-alias", "tomcat",
						// 		"-dname", dname,
						// 		//	TODO	is this the right place? for built shells?
						// 		"-keystore", pathname.toString(),
						// 		"-storepass", "inonit",
						// 		"-keypass", "inonit"
						// 	]
						// });
						jsh.shell.run({
							command: jsh.shell.java.keytool,
							arguments: [
								"-genkey",
								"-noprompt",
								"-alias", "tomcat",
								"-dname", dname,
								"-keyalg", "RSA",
								//	TODO	is this the right place? for built shells?
								"-keystore", pathname.toString(),
								"-storepass", "inonit",
								"-keypass", "inonit"
							]
						});
					}
					return jsh.shell.HOME.getFile(".inonit/jsh/etc/keystore");
				}

				var getMimeType = function(file) {
					var type = jsh.io.mime.Type.fromName(file.pathname.basename);
					if (type) return type;
					type = jsh.io.mime.Type.guess({
						name: file.pathname.basename
					});
					if (type) return type;
				};

				jsh.httpd.nugget = {};
				jsh.httpd.nugget.getMimeType = getMimeType;

				jsh.httpd.spi = {
					argument: void(0)
				};

				/**
				 * @param { slime.Loader } resources
				 * @param { jsh.httpd.servlet.descriptor } servlet
				 * @returns { { resources: slime.Loader, load: (scope: slime.servlet.Scope) => void, $loader?: slime.Loader } }
				 */
				jsh.httpd.spi.argument = function(resources,servlet) {
					if (servlet["$loader"]) throw new Error("servlet.$loader provided");

					/** @returns { slime.jrunscript.file.File } */
					var toFile = function(servlet) {
						return servlet;
					};

					/** @type { (servlet: jsh.httpd.servlet.descriptor) => servlet is jsh.httpd.servlet.byLoad } */
					var isByLoad = function(servlet) {
						return Boolean(servlet["load"]);
					}

					/** @type { (servlet: jsh.httpd.servlet.descriptor) => servlet is jsh.httpd.servlet.byFile } */
					var isByFile = function(servlet) {
						return Boolean(servlet["file"]);
					}

					if (servlet["pathname"] && servlet["directory"] === false) {
						servlet = { file: toFile(servlet) };
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

					/**
					 *	@param { { load: (scope: slime.servlet.Scope) => void, $loader?: slime.Loader } } o
					 */
					var returning = function(o) {
						return Object.assign(o, { resources: resources });
					};

					if (isByLoad(servlet)) {
						return returning({
							load: servlet.load
						});
					} else if (isByFile(servlet)) {
						var file = servlet.file;
						return returning({
							$loader: new jsh.file.Loader({
								directory: servlet.file.parent,
								type: getMimeType
							}),
							load: function(scope) {
								jsh.loader.run(file.pathname, scope);
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
					var Tomcat = (
						/**
						 * @constructor
						 * @param { ConstructorParameters<jsh.httpd.Exports["Tomcat"]>[0] } p
						 */
						function(p) {
							if (!p) p = {};
							var tomcat = new Packages.org.apache.catalina.startup.Tomcat();

							/** @returns { slime.jrunscript.file.Directory } */
							var castToDirectory = function(node) {
								return node;
							}

							var base = (p.base) ? p.base : castToDirectory(jsh.shell.TMPDIR.createTemporary({ directory: true, prefix: "tomcat" }));

							this.base = base;

							var getOpenPort = function() {
								var address = new Packages.java.net.ServerSocket(0);
								var rv = address.getLocalPort();
								address.close();
								return rv;
							};

							var port = (p.port) ? p.port : getOpenPort();

							this.port = port;

							if (p.https) {
								var file = keygen();
								var _https = new Packages.org.apache.catalina.connector.Connector();
								var hport = (p.https.port) ? p.https.port : getOpenPort();
								_https.setPort(hport);
								_https.setSecure(true);
								_https.setScheme("https");
								//	TODO	some DRY violations; see keygen() above
								_https.setAttribute("keyAlias", "tomcat");
								_https.setAttribute("keystorePass", "inonit");
								_https.setAttribute("keystoreFile", file.toString());
								_https.setAttribute("clientAuth", "false");
								_https.setAttribute("sslProtocol", "TLS");
								_https.setAttribute("SSLEnabled", "true");
								tomcat.getService().addConnector(_https);
								this.https = {
									port: hport
								};
							}

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

							var addContext = function(path,base) {
								return tomcat.addContext(path, base.pathname.java.adapt().getCanonicalPath());
							};

							/**
							 * @param { any } context - Tomcat native Java context object
							 * @param { slime.Loader } resources
							 * @param { string } pattern
							 * @param { string } servletName
							 * @param { jsh.httpd.servlet.descriptor } servletDeclaration
							 */
							var addServlet = function(context,resources,pattern,servletName,servletDeclaration) {
								var servletImplementation = jsh.httpd.spi.argument(resources,servletDeclaration);
								Packages.org.apache.catalina.startup.Tomcat.addServlet(context,servletName,new JavaAdapter(
									Packages.javax.servlet.http.HttpServlet,
									new function() {
										//	TODO	could use jsh.io here
										var servlet;

										this.init = function() {
											/** @type { { $host: slime.servlet.internal.$host.jsh } } */
											var apiScope = {
												$host: {
													parameters: (servletDeclaration.parameters) ? servletDeclaration.parameters : {},

													loaders: {
														api: new $loader.Child("server/"),
														script: servletImplementation.$loader,
														container: servletImplementation.resources
													},

													Loader: jsh.io.Loader,

													getCode: function(scope) {
														servletImplementation.load(scope);
													},

													//	TODO	should not needlessly rename this
													$java: $slime,

													server: server,
													api: api,

													script: function(script) {
														servlet = script;
													}
												}
											};
											$loader.run("api.js", apiScope);
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
							};

							/** @type { jsh.httpd.Tomcat["map"] } */
							this.map = function(m) {
								if (typeof(m.path) == "string" && m.servlets) {
									var context = addContext(m.path,base);
									var id = 0;
									for (var pattern in m.servlets) {
										addServlet(context,m.resources,pattern,"slime" + String(id++),m.servlets[pattern])
									}
								} else if (typeof(m.path) == "string" && m.webapp) {
									tomcat.getEngine().setParentClassLoader(tomcat.getEngine().getClass().getClassLoader());
									var context = tomcat.addWebapp(m.path, m.webapp.java.adapt().getCanonicalPath());
									jsh.shell.console("Added " + context);
								}
							};

							/** @type { jsh.httpd.Tomcat["servlet"] } */
							this.servlet = function(declaration) {
								addServlet(addContext("",base),declaration.resources,"/*","slime",declaration);
							};

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
					);

					jsh.httpd.Tomcat = Object.assign(Tomcat, { serve: void(0) });

					jsh.httpd.Tomcat.serve = function(p) {
						var loader = new jsh.file.Loader({ directory: p.directory });
						var getMimeType = function(path) {
							var rv = jsh.httpd.nugget.getMimeType(p.directory.getFile(path));
							if (rv && rv.getMedia() == "application" && rv.getSubtype() == "x.typescript") return "text/plain";
							return rv;
						}
						var tomcat = new jsh.httpd.Tomcat(p);
						tomcat.map({
							path: "",
							servlets: {
								"/*": {
									load: function(scope) {
										//	TODO	convert to Handler.Loader?
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

					jsh.httpd.plugin = {
						tools: void(0)
					};
					jsh.httpd.plugin.tools = function() {
						jsh.loader.plugins(new $loader.Child("tools/"));
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$slime,jsh,plugin,$loader)
