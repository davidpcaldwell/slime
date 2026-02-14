//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	TODO	clean up the plugin; rename plugin.jsh.api.html and include jsh.tomcat.js in this file or one with a better name
//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.httpd.Dependencies & { httpd: slime.jsh.httpd.Exports } } jsh
	 * @param { slime.jsh.plugin.plugin } plugin
	 * @param { slime.old.Loader } $loader
	 */
	function(Packages,JavaAdapter,$slime,$api,jsh,plugin,$loader) {
		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.web && jsh.java && jsh.java.log && jsh.io && jsh.io.mime && jsh.shell && jsh.file);
			},
			load: function() {
				if (!jsh.httpd) {
					jsh.httpd = {
						Resources: void(0),
						plugin: void(0),
						tools: void(0),
						nugget: void(0),
						spi: void(0),
						servlet: void(0),
						tomcat: void(0)
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

				/**
				 *
				 * @param { slime.jrunscript.file.File } file
				 * @returns { slime.mime.Type }
				 */
				function getMimeType(file) {
					var type = jsh.io.mime.Type.fromName(file.pathname.basename);
					if (type) return type;
					type = jsh.io.mime.Type.guess({
						name: file.pathname.basename
					});
					if (type) return type;
				}

				jsh.httpd.nugget = {
					getMimeType: getMimeType
				};

				jsh.httpd.spi = {
					servlet: {
						inWebapp: void(0)
					}
				};

				/** @type { (servlet: slime.jsh.httpd.servlet.Descriptor) => servlet is slime.jsh.httpd.servlet.DescriptorUsingLoad } */
				var isByLoad = function(servlet) {
					return Boolean(servlet["load"]);
				}

				/** @type { (servlet: slime.jsh.httpd.servlet.Descriptor) => servlet is slime.jsh.httpd.servlet.DescriptorUsingFile } */
				var isByFile = function(servlet) {
					return Boolean(servlet["file"]);
				}

				/** @type { (servlet: slime.jsh.httpd.servlet.Descriptor) => servlet is slime.jsh.httpd.servlet.DescriptorUsingResourcePath } */
				var isByResource = function(servlet) {
					return Boolean(servlet["resource"]);
				}

				/** @type { slime.jsh.httpd.Exports["spi"]["servlet"]["inWebapp"] } */
				jsh.httpd.spi.servlet.inWebapp = function(resources,servlet) {
					if (servlet["$loader"]) throw new Error("servlet.$loader provided");

					/**
					 *
					 * @param { (scope: slime.servlet.Scope) => void } run
					 * @param { () => slime.old.Loader } getScriptLoader
					 * @returns { slime.jsh.httpd.servlet.DescriptorUsingLoad["load"] }
					 */
					var toByLoad = function(run,getScriptLoader) {
						var $loader = getScriptLoader();
						return function(scope) {
							run($api.Object.compose(scope, { $loader: $loader }));
						}
					}

					/**
					 *
					 * @param { slime.jsh.httpd.servlet.Descriptor } servlet
					 * @returns { slime.jsh.httpd.servlet.DescriptorUsingLoad["load"] }
					 */
					var getLoad = function(servlet) {
						if (isByLoad(servlet)) {
							return servlet.load;
						} else if (isByFile(servlet)) {
							return toByLoad(
								function(scope) {
									jsh.loader.run(servlet.file.pathname, scope);
								},
								function getScriptLoader() {
									return new jsh.file.Loader({
										directory: servlet.file.parent,
										type: getMimeType
									})
								}
							);
						} else if (isByResource(servlet)) {
							return toByLoad(
								function(scope) {
									resources.run(servlet.resource, scope);
								},
								function() {
									var prefix = servlet.resource.split("/").slice(0,-1).join("/");
									if (prefix) prefix += "/";
									var $loader = resources.Child(prefix);
									return $loader;
								}
							)
						} else {
							throw new Error("Bad argument.");
						}
					};

					return {
						resources: resources,
						servlet: {
							parameters: servlet.parameters,
							load: getLoad(servlet)
						}
					};
				};

				jsh.httpd.Resources = $loader.module("plugin.jsh.resources.js", {
					getMimeType: getMimeType,
					jsh: jsh
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
							//	below added for Tomcat 8
							,"lib/tomcat-jni.jar"
							,"lib/tomcat-util-scan.jar"
							,"lib/jaspic-api.jar"
						].forEach(function(path) {
							jsh.loader.java.add(CATALINA_HOME.getRelativePath(path));
						});
						TOMCAT_CLASS = jsh.java.getClass("org.apache.catalina.startup.Tomcat");
					}
					return TOMCAT_CLASS;
				})();

				jsh.java.log.named("jsh.httpd").CONFIG("When trying to load Tomcat: class = %s CATALINA_HOME = %s", TOMCAT_CLASS, CATALINA_HOME);

				jsh.httpd.servlet = {
					Servlets: {
						from: {
							root: function(p) {
								return {
									path: "",
									resources: p.resources,
									servlets: {
										"/*": p.servlet
									}
								}
							}
						}
					}
				}

				/** @type { (webapps: slime.jsh.httpd.tomcat.AcceptOldForm) => slime.jsh.httpd.tomcat.MultipleWebapps["webapps"] } */
				var normalizeWebapps = function(webapps) {
					/** @type { (webapps: slime.jsh.httpd.tomcat.AcceptOldForm) => webapps is slime.jsh.httpd.tomcat.SingleWebapp } */
					var isSingleWebapp = function(webapps) {
						return Boolean(webapps["webapp"]);
					}

					/** @type { (webapps: slime.jsh.httpd.tomcat.AcceptOldForm) => webapps is slime.jsh.httpd.tomcat.MultipleWebapps } */
					var isMultipleWebapps = function(webapps) {
						return Boolean(webapps["webapps"]);
					}

					/** @type { (webapps: slime.jsh.httpd.tomcat.AcceptOldForm) => webapps is slime.jsh.httpd.servlet.configuration.WebappServlet } */
					var isServletWebapp = function(webapps) {
						return Boolean(webapps["servlet"]);
					}

					if (isSingleWebapp(webapps)) {
						return {
							"": webapps.webapp
						}
					} else if (isMultipleWebapps(webapps)) {
						return webapps.webapps;
					} else if (isServletWebapp(webapps)) {
						var servlets = jsh.httpd.servlet.Servlets.from.root(webapps);
						return {
							"": servlets
						}
					} else {
						return {};
					}
				}

				if (TOMCAT_CLASS) {
					var Tomcat = (
						/**
						 * @param { slime.jsh.httpd.tomcat.Configuration & (slime.jsh.httpd.tomcat.AcceptOldForm) } p
						 */
						function(p) {
							//	TODO	probably should not happen now that we specify webapps in the configuration
							if (!p) p = {};

							var _tomcat = new Packages.org.apache.catalina.startup.Tomcat();

							/** @returns { slime.jrunscript.file.Directory } */
							var castToDirectory = function(node) {
								return node;
							}

							/**
							 * The Tomcat server base directory.
							 */
							var base = (p.base) ? p.base : castToDirectory(jsh.shell.TMPDIR.createTemporary({ directory: true, prefix: "tomcat" }));

							var getOpenPort = function() {
								var address = new Packages.java.net.ServerSocket(0);
								var rv = address.getLocalPort();
								address.close();
								return rv;
							};

							var port = (p.port) ? p.port : getOpenPort();

							var rv = {};

							if (p.https) {
								var _https = new Packages.org.apache.catalina.connector.Connector();
								//	Do we need protocol? https://www.namecheap.com/support/knowledgebase/article.aspx/9441/33/installing-an-ssl-certificate-on-tomcat/
								var hport = (p.https.port) ? p.https.port : getOpenPort();
								_https.setPort(hport);
								//	maxThreads
								_https.setScheme("https");
								_https.setSecure(true);
								_https.setAttribute("SSLEnabled", "true");
								//	TODO	some DRY violations; see keygen() above
								if (!p.https.keystore) {
									var file = keygen();
									_https.setAttribute("keystoreFile", file.toString());
									_https.setAttribute("keystorePass", "inonit");
									_https.setAttribute("keyAlias", "tomcat");
								} else {
									_https.setAttribute("keystoreFile", p.https.keystore.file.toString());
									_https.setAttribute("keystorePass", p.https.keystore.password);
									_https.setAttribute("keystoreType", "PKCS12");
								}
								_https.setAttribute("clientAuth", "false");
								_https.setAttribute("sslProtocol", "TLS");
								_tomcat.getService().addConnector(_https);
								rv.https = {
									port: hport
								};
							} else {
								rv.https = void(0);
							}

							_tomcat.setBaseDir(base.toString());

							//	In Tomcat 7, we could just do this:
							//	tomcat.setPort(port);
							//	HTTP was the default connector, and was created automatically.

							//	In Tomcat 8, we need to add the connector explicitly, at least when HTTPS is present
							var _http = new Packages.org.apache.catalina.connector.Connector();
							_http.setPort(port);
							_http.setScheme("http");
							_tomcat.getService().addConnector(_http);

							var api = {
								$api: $api,
								js: jsh.js,
								java: jsh.java,
								io: jsh.io,
								web: jsh.web,
								//	TODO	explain; is this unnecessary for jsh servlets? May want to refactor types in api.js to
								//			reflect this
								loader: void(0)
							};

							var server = (
								function() {
									/** @type { slime.servlet.internal.server.Script } */
									var script = $loader.script("server.js");
									return script({
										api: api
									});
								}
							)();

							/**
							 * @param { string } path
							 * @returns
							 */
							var addContext = function(path) {
								/**
								 * @param { string } path
								 * @returns
								 */
								var getContextDocBase = function(path) {
									return jsh.shell.TMPDIR.createTemporary({ directory: true, prefix: "tomcat-context-docbase" });
								};

								return _tomcat.addContext(path, getContextDocBase(path).pathname.java.adapt().getCanonicalPath());
							};

							/**
							 * @param { any } context Tomcat native Java context object
							 * @param { slime.old.Loader | undefined } resources
							 * @param { string } pattern
							 * @param { string } servletName
							 * @param { slime.jsh.httpd.servlet.Descriptor } servletDeclaration
							 */
							var addServlet = function(context,resources,pattern,servletName,servletDeclaration) {
								var servletImplementation = jsh.httpd.spi.servlet.inWebapp(resources,servletDeclaration);
								Packages.org.apache.catalina.startup.Tomcat.addServlet(context,servletName,new JavaAdapter(
									Packages.javax.servlet.http.HttpServlet,
									new function() {
										//	TODO	could use jsh.io here
										var servlet;

										this.init = function() {
											/** @type { { $host: slime.servlet.internal.$host.jsh } } */
											var apiScope = {
												$host: {
													context: {
														stdio: {
															output: function(string) {
																jsh.shell.echo(string);
															},
															error: function(string) {
																jsh.shell.console(string);
															}
														}
													},

													parameters: (servletDeclaration.parameters) ? servletDeclaration.parameters : {},

													loaders: {
														api: $loader.Child("server/"),
														script: void(0),
														container: servletImplementation.resources
													},

													Loader: {
														tools: {
															toExportScope: jsh.io.old.loader.tools.toExportScope
														}
													},

													loadServletScriptIntoScope: servletImplementation.servlet.load,

													$slime: $slime,

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
								if (typeof(context.addServletMapping) == "function") {
									//	Tomcat 7
									context.addServletMapping(pattern,servletName);
								} else if (typeof(context.addServletMappingDecoded) == "function") {
									//	Tomcat 9
									context.addServletMappingDecoded(pattern,servletName,false);
								} else {
									throw new Error("Unable to locate API for adding servlet mapping to embedded Tomcat")
								}
							};

							/** @type { (context: slime.jsh.httpd.servlet.configuration.Context) => context is slime.jsh.httpd.servlet.configuration.Servlets } */
							var isServlets = function(context) {
								return Boolean(context["servlets"]);
							}

							/** @type { slime.jsh.httpd.Tomcat["map"] } */
							var map = function(m) {
								if (isServlets(m)) {
									var context = addContext(m.path);
									var id = 0;
									//	TODO	seems like we would duplicate servlet names with this pattern were map called more
									// 			than once
									for (var pattern in m.servlets) {
										addServlet(context,m.resources,pattern,"slime" + String(id++),m.servlets[pattern])
									}
								} else if (typeof(m.path) == "string" && m.webapp) {
									_tomcat.getEngine().setParentClassLoader(_tomcat.getEngine().getClass().getClassLoader());
									var _tomcatContext = _tomcat.addWebapp(m.path, m.webapp.java.adapt().getCanonicalPath());
									jsh.shell.console("Added " + _tomcatContext);
								}
							};

							var webapps = normalizeWebapps(p);

							Object.entries(webapps).forEach(function(entry) {
								map($api.Object.compose({ path: entry[0] }, entry[1]));
							});

							rv.map = $api.deprecate(map);

							rv.servlet = $api.deprecate(
								/** @type { slime.jsh.httpd.Tomcat["servlet"] } */
								function(declaration) {
									addServlet(addContext(""),declaration.resources,"/*","slime",declaration);
								}
							);

							var started = false;

							rv.start = function() {
								if (!started) {
									_tomcat.start();
									started = true;
								}
							}

							rv.run = function() {
								if (!started) {
									_tomcat.start();
									started = true;
								}
								var run = function() {
									_tomcat.getServer().await();
									started = false;
								};
								var fork = false;
								if (fork) {
									jsh.java.Thread.start({ call: run });
								} else {
									run();
								}
							}

							rv.stop = function() {
								_tomcat.stop();
								//	Destroy was not needed with Tomcat 7, but is needed with 9 (unknown whether needed with 8.5)
								_tomcat.destroy();
								started = false;
							}

							return {
								base: base,
								port: port,
								https: rv.https,
								map: rv.map,
								servlet: rv.servlet,
								start: rv.start,
								run: rv.run,
								stop: rv.stop
							}
						}
					);

					jsh.httpd.tomcat = {
						Server: {
							from: {
								configuration: Tomcat
							}
						}
					};

					jsh.httpd.Tomcat = Object.assign(Tomcat, { serve: void(0) });

					jsh.httpd.Tomcat.serve = function(p) {
						var loader = new jsh.file.Loader({ directory: p.directory });
						var getMimeType = function(path) {
							var rv = jsh.httpd.nugget.getMimeType(p.directory.getFile(path));
							if (rv && rv.media == "application" && rv.subtype == "x.typescript") return "text/plain";
							return rv;
						}
						var tomcat = jsh.httpd.Tomcat(p);
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

					jsh.shell.inject.httpd(jsh.httpd);

					jsh.httpd.plugin = {
						tools: void(0)
					};
					jsh.httpd.plugin.tools = function() {
						jsh.loader.plugins($loader.Child("tools/"));
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$slime,$api,jsh,plugin,$loader)
