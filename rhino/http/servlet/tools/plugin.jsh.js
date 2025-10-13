//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($api,jsh,$loader,plugin) {
		plugin({
			load: function() {
				if (!jsh.httpd) {
					jsh.httpd = {
						Resources: void(0),
						nugget: void(0),
						plugin: void(0),
						spi: void(0),
						tools: void(0),
						servlet: void(0),
						tomcat: void(0)
					};
				}
				jsh.httpd.tools = {
					build: void(0),
					proxy: void(0),
					getJavaSourceFiles: void(0),
					test: void(0)
				};


				/** @type { slime.jsh.httpd.tools.test.Exports["getWebXml"] } */
				var getWebXml = function(p) {
					if (!p.servlet) throw new TypeError("Required: p.servlet indicating webapp path of servlet to use.");

					var xml = $loader.get("web.xml").read(String);

					xml = $api.fp.now(
						xml,
						jsh.document.Document.edit(
							jsh.document.Parent.content.set.nodes(function(document) {
								return [
									document.children[0],
									document.children[1],
									document.children[4],
									document.children[5]
								]
							})
						)
					);

					/**
					 *
					 * @param { string } message
					 */
					var assertOnly = function(message) {
						//	Possibly this function should be called Stream.single? Stream.one?
						return $api.fp.now(
							$api.fp.Stream.only,
							$api.fp.Partial.impure.exception(function(stream) { return new Error(message); })
						);
					}

					var assertOne = function(message) {
						return $api.fp.now(
							$api.fp.Stream.first,
							$api.fp.Partial.impure.exception(function(stream) { return new Error(message); })
						);
					}

					xml = $api.fp.now(
						xml,
						jsh.document.Document.edit(
							$api.fp.pipe(
								jsh.document.Parent.nodes,
								$api.fp.Stream.filter(jsh.document.Node.isElementNamed("init-param")),
								$api.fp.Stream.filter(jsh.document.Node.hasChild(
									$api.fp.Predicate.and(
										jsh.document.Node.isElementNamed("param-name"),
										function(node) {
											if (!jsh.document.Node.isParent(node)) return false;
											return jsh.document.Parent.content.get.string.simple(node) == "script";
										}
									)
								)),
								assertOnly("Expected init-param with param-name = script"),
								function(/** @type { slime.runtime.document.Parent } */parent) {
									return $api.fp.Stream.from.array(
										parent.children.filter(jsh.document.Node.isElementNamed("param-value"))
									);
								},
								assertOnly("Expected init-param to have param-value child"),
								function(/** @type { slime.runtime.document.Parent } */parent) {
									jsh.document.Parent.content.set.text(p.servlet)(parent);
								}
							)
						)
					);

					xml = $api.fp.now(
						xml,
						jsh.document.Document.edit(
							$api.fp.pipe(
								jsh.document.Parent.nodes,
								$api.fp.Stream.filter(jsh.document.Node.hasChild(jsh.document.Node.isElementNamed("init-param"))),
								assertOne("Should have at least one element that has an <init-param> child"),
								$api.fp.Mapping.properties({
									initParamIndent: function(/** @type { slime.runtime.document.Parent } */parent) {
										//	TODO	could use some unit tests
										var index = parent.children.findIndex(jsh.document.Node.isElementNamed("init-param"));
										if (index == -1) throw new Error("Not found");
										if (index == 0) return $api.fp.Maybe.from.nothing();
										var previous = parent.children[index-1];
										if (!jsh.document.Node.isString(previous)) return $api.fp.Maybe.from.nothing();
										if (index > 1 && jsh.document.Node.isString(parent.children[index-2])) throw new Error("Unimplemented: multiple preceding string nodes");
										if (previous.data.indexOf("\n") == -1) return $api.fp.Maybe.from.nothing();
										var lines = previous.data.split("\n");
										var lineBefore = lines[lines.length - 1];
										if (!/^(\s*)$/.test(lineBefore)) return $api.fp.Maybe.from.nothing();
										return $api.fp.Maybe.from.some(lineBefore);
									},
									parent: function(/** @type { slime.runtime.document.Parent } */parent) {
										return parent;
									}
								}),
								function(arg) {
									//	TODO	except now we would actually want the last one
									var index = arg.parent.children.findIndex(jsh.document.Node.isElementNamed("init-param"));
									var at = index + 1;
									for (var name in p.parameters) {
										var initParamIndent = (arg.initParamIndent.present) ? { type: "text", data: "\n" + arg.initParamIndent.value } : { type: "text", data: "" };
										var initParamChildIndent = (arg.initParamIndent.present) ? { type: "text", data: "\n" + "\t" + arg.initParamIndent.value }: { type: "text", data: "" };
										arg.parent.children.splice(at++,0,initParamIndent);
										arg.parent.children.splice(at++,0,
											/** @type { slime.runtime.document.Element } */({
												type: "element",
												name: "init-param",
												attributes: [],
												children: [
													initParamChildIndent,
													/** @type { slime.runtime.document.Element } */({
														type: "element",
														name: "param-name",
														attributes: [],
														children: [
															/** @type { slime.runtime.document.Text } */({
																type: "text",
																data: name
															})
														],
														endTag: "</param-name>",
														selfClosing: false
													}),
													initParamChildIndent,
													/** @type { slime.runtime.document.Element } */({
														type: "element",
														name: "param-value",
														attributes: [],
														children: [
															/** @type { slime.runtime.document.Text } */({
																type: "text",
																data: p.parameters[name]
															})
														],
														endTag: "</param-value>",
														selfClosing: false
													}),
													initParamIndent
												],
												endTag: "</init-param>",
												selfClosing: false
											})
										);
									}
								}
							)
						)
					);

					return xml;
				}

				jsh.httpd.tools.test = {
					getWebXml: getWebXml
				}

				/**
				 *
				 * @type { slime.jsh.httpd.Exports["tools"]["build"] }
				 */
				jsh.httpd.tools.build = Object.assign(
					function(/** @type { slime.jsh.httpd.Build } */p) {
						if (!p.destination.directory) {
							p.destination.directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
						}
						var WEBAPP = p.destination.directory;
						WEBAPP.getRelativePath("WEB-INF").createDirectory();
						if (p.rhino) {
							(function() {
								jsh.internal.bootstrap.rhino.forJava(
									jsh.internal.bootstrap.java.getMajorVersion()
								).download( WEBAPP.getRelativePath("WEB-INF/lib").createDirectory().pathname.java.adapt() )
							})();
						}
						var lib = WEBAPP.getRelativePath("WEB-INF/lib").createDirectory({
							ifExists: function(dir) {
								return false;
							}
						});
						if (p.libraries) {
							for (var x in p.libraries) {
								p.libraries[x].copy(lib.getRelativePath(x), { recursive: true });
							}
						}
						var SLIME = jsh.shell.jsh.src;
						if (!SLIME) {
							SLIME = jsh.shell.jsh.home.getSubdirectory("src");
						}

						var compile = p.compile || [];

						(function compileSlimeCodeToWebapp() {
							var SERVLET = SLIME.getSubdirectory("rhino/http/servlet");
							//	Compile the servlet to WEB-INF/classes
							var classpath = jsh.file.Searchpath([]);
							var rhino = jsh.internal.api.rhino.forCurrentJava().local( WEBAPP.getRelativePath("WEB-INF/lib").createDirectory().pathname.os.adapt() );
							if (rhino) rhino.forEach(function(location) {
								classpath.pathnames.push(jsh.file.Pathname(location.pathname));
							});
							classpath.pathnames.push(WEBAPP.getRelativePath("WEB-INF/lib/js.jar"));
							var CATALINA_HOME;
							if (jsh.shell.environment.CATALINA_HOME) CATALINA_HOME = jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
							if (!CATALINA_HOME) CATALINA_HOME = jsh.shell.jsh.lib.getSubdirectory("tomcat");
							if (!CATALINA_HOME) {
								throw new Error("Could not find Tomcat directory to locate servlet API");
							}
							jsh.shell.echo("CATALINA_HOME = " + CATALINA_HOME);
							classpath.pathnames.push(CATALINA_HOME.getRelativePath("lib/servlet-api.jar"));
							var sourcepath = jsh.file.Searchpath([]);
							sourcepath.pathnames.push(SLIME.getRelativePath("rhino/system/java"));
							sourcepath.pathnames.push(SLIME.getRelativePath("loader/jrunscript/java"));
							sourcepath.pathnames.push(SLIME.getRelativePath("loader/jrunscript/rhino/java"));
							sourcepath.pathnames.push(SLIME.getRelativePath("jrunscript/host/java"));
							if (p.rhino) {
								sourcepath.pathnames.push(SLIME.getRelativePath("jrunscript/host/rhino/java"));
							}
							sourcepath.pathnames.push(SLIME.getRelativePath("rhino/http/servlet/java"));
							if (p.rhino) {
								sourcepath.pathnames.push(SLIME.getRelativePath("rhino/http/servlet/rhino/java"));
							}
							var sources = [
								SERVLET.getRelativePath("java/inonit/script/servlet/Servlet.java"),
								SERVLET.getRelativePath("java/inonit/script/servlet/Nashorn.java")
							];
							if (p.rhino) {
								//	this is not explicitly referenced from Rhino servlet but is required for httpd.java.Thread
								sources.push(
									SLIME.getRelativePath("jrunscript/host/rhino/java/inonit/script/runtime/Threads.java")
								);
								sources.push(
									SERVLET.getRelativePath("rhino/java/inonit/script/servlet/Rhino.java")
								);
							}
							var result = jsh.java.tools.javac({
								destination: WEBAPP.getRelativePath("WEB-INF/classes"),
								classpath: classpath,
								sourcepath: sourcepath,
								source: (p.java && p.java.version) ? p.java.version : null,
								target: (p.java && p.java.version) ? p.java.version : null,
								arguments: sources.concat(compile.map(function(node) { return node.pathname }))
							});
							//	TODO	seems like below should be changed to console, but not changing right now in the middle of
							//			a large refactor
							jsh.shell.echo("Exit status of javac: " + result.status);
							if (result.status) {
								jsh.shell.echo("Compilation failure for arguments: " + result.arguments.join(" "));
							}
						})();

						(function copySlimeCodeToWebapp() {
							SLIME.getSubdirectory("loader").list().forEach(function(node) {
								//	TODO	dangerous as we move more code into the loader; was just expression.js and api.js
								if (!node.directory) {
									node.copy(WEBAPP.getRelativePath("WEB-INF/loader/" + node.pathname.basename), { recursive: true });
								}
							});
							SLIME.getSubdirectory("loader/jrunscript").list().forEach(function(node) {
								//	Was just expression.js
								if (/\.js$/.test(node.pathname.basename)) {
									node.copy(WEBAPP.getRelativePath("WEB-INF/loader/jrunscript/" + node.pathname.basename), { recursive: true });
								}
							});
							SLIME.getFile("rhino/http/servlet/api.js").copy(WEBAPP.getRelativePath("WEB-INF/api.js"));
							SLIME.getFile("rhino/http/servlet/server.js").copy(WEBAPP.getRelativePath("WEB-INF/server.js"));
							SLIME.getFile("rhino/http/servlet/upload.js").copy(WEBAPP.getRelativePath("WEB-INF/upload.js"));

							["js/debug","js/object","js/web","jrunscript/host","jrunscript/io","rhino/http/servlet/server"].forEach(function(path) {
								SLIME.getSubdirectory(path).copy(WEBAPP.getRelativePath("WEB-INF/slime/" + path), { recursive: true });
							});
						})();

						(function() {
							var xml = getWebXml(p);
							WEBAPP.getRelativePath("WEB-INF/web.xml").write(xml, { append: false });
						})();

						// if (p.buildResources) {
						// 	p.buildResources();
						// } else if (p.Resources) {
						var resources = new jsh.httpd.Resources.Constructor();
						p.Resources.call(resources);
						resources.build(WEBAPP);
						// }

						if (p.destination.war) {
							jsh.file.zip({
								from: p.destination.directory.pathname,
								to: p.destination.war
							});
						}
					}
				);

				jsh.httpd.tools.getJavaSourceFiles = function(pathname) {
					/** @type { (node: slime.jrunscript.file.Node) => node is slime.jrunscript.file.File } */
					var isFile = function(node) { return true; };
					var toFile = function(node) { if (isFile(node)) return node; }
					if (pathname.directory) {
						var nodes = pathname.directory.list({
							recursive: true,
							type: pathname.directory.list.ENTRY
						}).filter(function(entry) {
							return /\.java/.test(entry.node.pathname.basename);
						}).map(function(entry) {
							return entry.node;
						}).map(toFile);
						return nodes;
					} else {
						return [pathname.file];
					}
				};
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.web && jsh.java && jsh.io && jsh.ip && jsh.http && jsh.shell && jsh.httpd && jsh.httpd.tools);
			},
			load: function() {
				var scripts = {
					/** @type { slime.servlet.proxy.Script } */
					proxy: $loader.script("proxy.js")
				};
				jsh.httpd.tools.proxy = scripts.proxy({
					library: {
						web: jsh.web,
						java: jsh.java,
						io: jsh.io,
						ip: jsh.ip,
						http: jsh.http,
						jsh: {
							shell: jsh.shell,
							httpd: jsh.httpd
						}
					}
				});
			}
		})
	}
//@ts-ignore
)($api,jsh,$loader,plugin);
