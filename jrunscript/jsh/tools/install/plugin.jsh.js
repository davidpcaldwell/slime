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
	 * @param { object } plugins
	 * @param { slime.jsh.plugin.plugin } plugin
	 * @param { slime.Loader } $loader
	 */
	function(Packages,JavaAdapter,$api,jsh,plugins,plugin,$loader) {
		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.web && jsh.java && jsh.ip && jsh.time && jsh.file && jsh.http && jsh.shell && jsh.java.tools && jsh.tools && jsh.tools.install && plugins.scala);
			},
			load: function() {
				/**
				 * @type { slime.jsh.shell.Exports["tools"]["rhino"]["install"] }
				 */
				var installRhino = $api.events.Function(
					function(p,events) {
						if (!p) p = {};
						var lib = (p.mock && p.mock.lib) ? p.mock.lib : jsh.shell.jsh.lib;
						if (!jsh.shell.jsh.lib) throw new Error("Shell does not have lib");
						if (lib.getFile("js.jar") && !p.replace) {
							events.fire("console", "Rhino already installed at " + lib.getFile("js.jar"));
							return;
						} else if (p.replace) {
							events.fire("console", "Replacing Rhino at " + lib.getRelativePath("js.jar") + " ...");
						} else {
							events.fire("console", "No Rhino at " + lib.getRelativePath("js.jar") + "; installing ...");
						}
						events.fire("console", "Installing Rhino to " + lib.getRelativePath("js.jar") + " ...");
						var operation = "copy";
						if (!p.local) {
							/**
							 * @type { slime.internal.jrunscript.bootstrap.Global }
							 */
							var jrunscript = {
								$api: {
									arguments: ["api"]
								},
								load: function() {
									//jsh.shell.console("load(" + Array.prototype.slice.call(arguments) + ")");
								},
								Packages: Packages,
								JavaAdapter: JavaAdapter,
								readFile: void(0),
								readUrl: void(0),
								Java: void(0)
							};
							//	TODO	push this back to jsh.shell as jsh.shell.jrunscript.api?
							var SRC = (function() {
								if (jsh.shell.jsh.home) return jsh.shell.jsh.home.getRelativePath("jsh.js");
								if (jsh.shell.jsh.src) return jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js");
							})();
							jsh.loader.run(
								SRC,
								{},
								jrunscript
							);
							var _rhino = (p.mock && p.mock.rhino) ? p.mock.rhino.pathname.java.adapt() : jrunscript.$api.rhino.download(p.version);
							p.local = jsh.file.Pathname(String(_rhino.getCanonicalPath())).file;
							operation = "move";
						}
						p.local[operation](lib.getRelativePath("js.jar"), { recursive: true, overwrite: true });
						events.fire("installed", { to: lib.getRelativePath("js.jar") });
						events.fire("console", "Installed Rhino at " + lib.getRelativePath("js.jar"));
					}, {
						console: function(e) {
							jsh.shell.console(e.detail);
						}
					}
				);

				jsh.shell.tools = {
					rhino: void(0),
					tomcat: void(0),
					ncdbg: void(0),
					kotlin: void(0),
					jsyaml: void(0),
					mkcert: void(0),
					selenium: void(0),
					node: void(0),
					javamail: void(0),
					jsoup: void(0),
					postgresql: void(0),
					scala: void(0)
				};

				jsh.shell.tools.rhino = {
					install: installRhino,
					require: function(p) {
						return function(events) {
							var at = jsh.shell.jsh.lib.getRelativePath("js.jar")
							$api.fp.world.now.action(
								jsh.shell.jsh.require,
								{
									satisfied: function() { return Boolean(at.file); },
									install: function() { return installRhino(p, events); }
								},
								{
									installed: function(e) {
										events.fire("installed", at.toString());
									},
									installing: function(e) {
										events.fire("installing", at.toString());
									},
									satisfied: function() {
										events.fire("satisfied", at.toString());
									}
								}
							);
						}
					}
				};

				(function deprecated() {
					jsh.tools.rhino = new function() {
						this.install = $api.deprecate(installRhino);
					};
					$api.deprecate(jsh.tools,"rhino");
					jsh.tools.install["rhino"] = {};
					jsh.tools.install["rhino"].install = $api.deprecate(installRhino);
					$api.deprecate(jsh.tools.install,"rhino");
				})();

				var ncdbg = new function() {
					Object.defineProperty(this, "installed", {
						get: function() {
							return jsh.shell.jsh.lib.getSubdirectory("ncdbg");
						}
					});

					this.install = $api.events.Function(function(p,events) {
						if (!p) p = {};
						if (!p.version) p.version = "0.8.4";
						if (p.replace) {
							if (jsh.shell.jsh.lib.getSubdirectory("ncdbg")) {
								jsh.shell.jsh.lib.getSubdirectory("ncdbg").remove();
							}
						} else {
							if (jsh.shell.jsh.lib.getSubdirectory("ncdbg")) {
								//	already installed
								//	TODO	fire event
								return;
							}
						}
						events.fire("console", { message: "Installing ncdbg ..." });
						var isReleasedVersion = ["0.8.0","0.8.1","0.8.2","0.8.3","0.8.4"].some(function(version) {
							return p.version == version;
						});
						if (isReleasedVersion) {
							jsh.tools.install.install({
								url: "https://github.com/provegard/ncdbg/releases/download/" + p.version + "/ncdbg-" + p.version + ".zip",
								format: jsh.tools.install.format.zip,
								to: jsh.shell.jsh.lib.getRelativePath("ncdbg")
							});
						} else if (p.version == "master") {
							var src = jsh.shell.jsh.src.getRelativePath("local/src/ncdbg");
							//	TODO	could do more complex state management; use fetch to update and so forth
							if (p.replace) {
								if (src.directory) src.directory.remove();
							}
							var remote = new jsh.tools.git.oo.Repository({
								remote: "https://github.com/davidpcaldwell/ncdbg.git"
							});
							var local = remote.clone({ to: src });
							events.fire("console", { message: "Checked out source." });
							if (src.directory && src.directory.getSubdirectory("build/distributions")) {
								src.directory.getSubdirectory("build/distributions").remove();
							}
							jsh.shell.run({
								command: local.directory.getFile("gradlew"),
								arguments: [
									"distZip"
								],
								directory: local.directory
							});

							/** @type { slime.js.Cast<slime.jrunscript.file.File> } */
							var castToFile = $api.fp.cast.unsafe;

							var distribution = src.directory.getSubdirectory("build/distributions").list().map(castToFile)[0];
							jsh.tools.install.install({
								file: distribution,
								format: jsh.tools.install.format.zip,
								to: jsh.shell.jsh.lib.getRelativePath("ncdbg")
							});
						} else {
							throw new Error();
						}
						jsh.shell.run({
							command: "chmod",
							arguments: [
								"+x",
								jsh.shell.jsh.lib.getSubdirectory("ncdbg").getFile("bin/ncdbg")
							]
						});
						if (!p.nopatch) {
							//	TODO	See https://github.com/provegard/ncdbg/issues/97
							var launcherCode = jsh.shell.jsh.lib.getFile("ncdbg/bin/ncdbg").read(String);
							if (p.version == "0.8.0" || p.version == "master") {
								launcherCode = launcherCode.replace(/\/\$\{JAVA_HOME\/\:\/\}/g, "${JAVA_HOME}");
							} else if (p.version == "0.8.1") {
								launcherCode = launcherCode.replace("ncdbg-0.8.1.jar", "ncdbg-0.8.1.jar:${JAVA_HOME}/lib/tools.jar");
							}
							jsh.shell.jsh.lib.getRelativePath("ncdbg/bin/ncdbg").write(launcherCode, { append: false });
						}
					});
				};

				jsh.shell.tools.ncdbg = ncdbg;

				(function deprecated() {
					jsh.tools.ncdbg = ncdbg;
					$api.deprecate(jsh.tools,"ncdbg");
				})();

				/** @type { slime.jsh.shell.tools.internal.tomcat.Script } */
				var script = $loader.script("tomcat.js");
				var tomcat = script({
					$api: jsh.tools.install.$api,
					jsh: jsh
				});
				jsh.shell.tools.tomcat = tomcat;

				(function deprecated() {
					jsh.tools.tomcat = tomcat;
					$api.deprecate(jsh.tools,"tomcat");
					jsh.tools.install["tomcat"] = tomcat;
					$api.deprecate(jsh.tools.install,"tomcat");
				})();

				jsh.shell.tools.mkcert = (function() {
					//	TODO	deal with Firefox
					//	TODO	deal with Java
					var location = (jsh.shell.jsh.lib) ? jsh.shell.jsh.lib.getRelativePath("bin/mkcert") : void(0);

					/**
					 *
					 * @param { slime.jrunscript.file.File } program
					 * @returns { slime.jsh.shell.tools.mkcert.Installation }
					 */
					function Installation(program) {
						var CAROOT = $api.fp.impure.Input.memoized(function() {
							var result = jsh.shell.run({
								command: program,
								arguments: ["-CAROOT"],
								stdio: {
									output: String
								}
							});
							return jsh.file.Pathname(result.stdio.output.trim());
						});

						var isTrusted = function(cert) {
							var result = jsh.shell.run({
								command: "security",
								//	security verify-cert -c "$(src/khoros/slim/slime/local/jsh/lib/bin/mkcert -CAROOT)/rootCA.pem"
								arguments: [
									"verify-cert",
									"-c", cert
								],
								stdio: {
									output: null,
									error: null
								},
								evaluate: $api.fp.identity
							});
							return result.status === 0;
						}

						return {
							program: program,
							isTrusted: function() {
								var root = CAROOT();
								if (!root.directory) return false;
								if (!root.directory.getFile("rootCA.pem")) return false;
								return isTrusted(root.directory.getFile("rootCA.pem"));
							},
							pkcs12: function(p) {
								jsh.shell.run({
									command: program,
									arguments: $api.Array.build(function(rv) {
										rv.push("-pkcs12");
										if (p.to) rv.push("-p12-file", p.to);
										rv.push.apply(rv, p.hosts);
									})
								});
							}
						}
					}

					return {
						install: function(p) {
							var destination = (p && p.destination) ? p.destination : location;

							/**
							 *
							 * @param { string } os
							 * @param { string } arch
							 * @returns
							 */
							var getBinaryUrl = function(os,arch) {
								if (os == "Linux") {
									return "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64";
								} else if (os == "Mac OS X") {
									if (arch == "aarch64") {
										return "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-darwin-arm64";
									} else {
										return "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-darwin-amd64";
									}
								}
							}

							var at = jsh.tools.install.get({ url: getBinaryUrl(jsh.shell.os.name, jsh.shell.os.arch) });

							at.copy(destination, {
								filter: function(p) {
									return true;
								},
								recursive: true
							});

							jsh.shell.console("Installed mkcert to: " + destination);

							jsh.shell.run({
								command: "chmod",
								arguments: [
									"+x", destination
								]
							});

							jsh.shell.run({
								command: destination.file,
								arguments: ["-install"]
							});

							return Installation(destination.file);
						},
						require: function() {
							if (!location.file) {
								this.install();
							}
							return Installation(location.file);
						}
					}
				})();

				//	TODO	probably want to create a jrunscript/io version of this also, or even a loader/ version given that this
				//			is pure JavaScript
				jsh.shell.tools.jsyaml = (function() {
					var location = (jsh.shell.jsh.lib) ? jsh.shell.jsh.lib.getRelativePath("js-yaml.js") : null;

					var fetchCode = function() {
						return new jsh.http.Client().request({
							url: "https://raw.githubusercontent.com/nodeca/js-yaml/v3/dist/js-yaml.js",
							evaluate: function(response) {
								return response.body.stream.character().asString();
							}
						});
					};

					var load = function(code) {
						return $api.debug.disableBreakOnExceptionsFor(function() {
							var global = {};
							eval(code);
							return global.jsyaml;
						})();
					}

					var install = (location) ? function() {
						var code = fetchCode();
						location.write(code, { append: false });
						return load(code);
					} : void(0)

					return $api.Object.compose(
						(install) ? { install: install } : {},
						{
							require: function() {
								var code = (function() {
									if (location) {
										if (location.file) {
											return location.file.read(String);
										} else {
											var rv = fetchCode();
											location.write(rv, { append: false });
											return rv;
										}
									} else {
										return fetchCode();
									}
								})();
								return load(code);
							},
							load: function() {
								var code = (location && location.file) ? location.file.read(String) : fetchCode();
								return load(code);
							}
						}
					);
				})();

				jsh.shell.tools.selenium = (
					function() {
						return {
							load: function() {
								if (jsh.shell.jsh.lib.getSubdirectory("selenium/java")) {
									if (jsh.shell.jsh.lib.getSubdirectory("selenium/chrome")) {
										Packages.java.lang.System.setProperty("webdriver.chrome.driver",jsh.shell.jsh.lib.getRelativePath("selenium/chrome/chromedriver").toString());
									}
									jsh.shell.jsh.lib.getSubdirectory("selenium/java/lib").list().forEach(function(node) {
										//jsh.shell.console("node = " + node);
										jsh.loader.java.add(node.pathname);
									});
									jsh.shell.jsh.lib.getSubdirectory("selenium/java").list().forEach(function(node) {
										//jsh.shell.console("node = " + node);
										jsh.loader.java.add(node.pathname);
									});
								} else {
									throw new Error("Could not be loaded; is Selenium installed? Try ./jsh jrunscript/jsh/tools/install/selenium.jsh.js");
								}
							}
						};
					}
				)();

				var kotlin = (jsh.shell.jsh.lib) ? new function() {
					var location = jsh.shell.jsh.lib.getRelativePath("kotlin");

					this.install = $api.events.Function(function(p,events) {
						var URL = "https://github.com/JetBrains/kotlin/releases/download/v1.5.0/kotlin-compiler-1.5.0.zip";

						var existing = location.directory;
						if (existing) {
							if (p.replace) {
								existing.remove();
							} else {
								events.fire("console", "Kotlin already installed.");
								return void(0);
							}
						}
						events.fire("console", "Installing Kotlin from " + URL + " ...");

						jsh.tools.install.install({
							url: URL,
							to: location,
							getDestinationPath: function(file) {
								return "kotlinc";
							}
						});

						jsh.shell.run({
							command: "chmod",
							arguments: $api.Array.build(function(rv) {
								rv.push("+x", location.directory.getRelativePath("bin/kotlinc"));
							})
						});
					});
				} : null;
				jsh.shell.tools.kotlin = kotlin;

				var scala = (jsh.shell.jsh.lib) ? (
					function() {
						/** @type { slime.jsh.shell.tools.scala.Exports["Installation"] } */
						var Installation = {
							from: {
								jsh: function() {
									var location = jsh.shell.jsh.lib.getRelativePath("scala");
									return {
										base: location.os.adapt().pathname
									}
								}
							},
							install: function(installation) {
								return function(p) {
									return function(events) {
										//	TODO	wo API needed
										if (p.majorVersion == 2) {
											jsh.tools.install.install({
												//	UNIX only
												url: "https://downloads.lightbend.com/scala/2.13.10/scala-2.13.10.tgz",
												to: jsh.file.Pathname(installation.base)
											});
										} else if (p.majorVersion == 3) {
											jsh.tools.install.install({
												url: "https://github.com/lampepfl/dotty/releases/download/3.2.1/scala3-3.2.1.tar.gz",
												to: jsh.file.Pathname(installation.base)
											});
										} else {
											throw new Error("Unsupported Scala major version: " + p.majorVersion);
										}
									}
								}
							},
							getVersion: plugins.scala.Installation.getVersion,
							compile: plugins.scala.Installation.compile,
							run: plugins.scala.Installation.run
						};

						return {
							Installation: Installation
						};
					}
				)() : null;

				jsh.shell.tools.scala = scala;

				jsh.shell.tools.jsoup = (function() {
					var rv = {};

					var location = (jsh.shell.jsh.lib) ? jsh.shell.jsh.lib.getRelativePath("jsoup.jar") : void(0);

					if (location) rv.install = function(p) {
						var to = location;
						if (!p) p = {};
						if (!to.file || p.upgrade) {
							var response = new jsh.http.Client().request({
								url: "https://jsoup.org/packages/jsoup-1.12.1.jar"
							});
							to.write(response.body.stream, { append: false });
							//	TODO	the below code isn't very DRY; hits a special API for reloading rather than just reloading the plugin; at least this works for both
							//			unbuilt and built shells
							//	TODO	it is also untested
							jsh.loader.plugins(to);
							jsh.document.Document.Html.$reload();
						}
					};

					Object.defineProperty(rv, "installed", {
						get: function() {
							if (!location) return null;
							if (location.file) return {};
							return null;
						}
					});

					rv.require = function require(p) {
						$api.fp.world.now.tell(jsh.shell.jsh.require({
							satisfied: function() { return Boolean(jsh.shell.jsh.lib.getFile("jsoup.jar")); },
							install: function() {
								return rv.install();
							}
						}));
					};

					return rv;
				})();

				jsh.shell.tools.javamail = (function() {
					var to = jsh.shell.jsh.lib && jsh.shell.jsh.lib.getRelativePath("javamail.jar");

					var install = function(p) {
						if (!to.file) {
							//	Moving to https://projects.eclipse.org/projects/ee4j.javamail for version 1.6.3
							//	TODO	note that there is now a 1.6.5 to which we can upgrade: https://github.com/eclipse-ee4j/mail/releases/tag/1.6.5
							var response = new jsh.http.Client().request({
								url: "https://github.com/javaee/javamail/releases/download/JAVAMAIL-1_6_2/javax.mail.jar"
							});
							to.write(response.body.stream, { append: false });
						}
					};

					return (to) ? {
						install: install,
						require: function() {
							$api.fp.world.now.tell(jsh.shell.jsh.require({
								satisfied: function() { return Boolean(to.file); },
								install: install
							}));
						}
					} : void(0);
				})();

				jsh.shell.tools.postgresql = {
					jdbc: new function() {
						var location = jsh.shell.jsh.lib && jsh.shell.jsh.lib.getRelativePath("postgresql.jar");

						var install = (function() {
							if (!this.installed || this.installed.version != "42.2.5") {
								var response = new jsh.http.Client().request({
									//	Requires Java 8
									url: "https://jdbc.postgresql.org/download/postgresql-42.2.5.jar"
								});
								location.write(response.body.stream, { append: false });
							}
						}).bind(this);

						if (location) this.install = install;

						Object.defineProperty(this, "installed", {
							get: function() {
								if (location && location.file) {
									var jar = new jsh.java.tools.Jar({ file: location.file });
									var manifest = jar.manifest;
									return {
										version: manifest.main["Implementation-Version"]
									};
								}
								return void(0);
							}
						});

						if (location) this.require = function(p,on) {
							$api.fp.world.now.action(
								jsh.shell.jsh.require,
								{
									satisfied: function() { return Boolean(location.file); },
									install: function() { install(); }
								},
								on
							)
						}
					}
				}

				var gradle = (function() {
					var URL = "https://services.gradle.org/distributions/gradle-6.8-bin.zip";

					return new function() {
						this.install = function(p,events) {
							jsh.tools.install.install({
								url: URL,
								format: jsh.tools.install.format.zip,
								to: jsh.shell.jsh.lib.getRelativePath("gradle"),
								getDestinationPath: function(file) {
									return "gradle-6.8";
								},
								replace: true
							}, events);
							jsh.shell.run({
								command: "chmod",
								arguments: ["+x", jsh.shell.jsh.lib.getSubdirectory("gradle").getFile("bin/gradle")]
							});
						}
					}
				})();

				jsh.tools.gradle = gradle;
			}
		});

		plugin({
			isReady: function() {
				return Boolean(plugins.node && jsh.file && jsh.shell && jsh.shell.tools && jsh.tools.install);
			},
			load: function() {
				/** @type { slime.jrunscript.tools.node.internal.JshPluginInterface } */
				var helper = plugins.node;

				var node = helper.module({
					context: {
						library: {
							file: jsh.file,
							shell: jsh.shell,
							install: jsh.tools.install
						}
					}
				});

				jsh.shell.tools.node = (function integratedNode() {
					if (!jsh.shell.jsh.lib) return;

					var location = jsh.shell.jsh.lib.getRelativePath("node");

					/** @type { slime.jsh.shell.tools.node.Managed } */
					var managed = {
						installation: node.Installation.from.location({
							filesystem: jsh.file.world.filesystems.os,
							pathname: location.toString()
						}),
						installed: void(0),
						require: void(0)
					}

					Object.defineProperty(managed, "installed", {
						get: function() {
							return node.object.at({ location: location.toString() });
						},
						enumerable: true
					});

					managed.require = function() {
						return function(events) {
							//	TODO	this is hard-coded in several places now
							var VERSION = "20.9.0";
							//	TODO	horrendous, but let's go with it for now
							if (jsh.file.Pathname("/etc/os-release").file) {
								var string = jsh.file.Pathname("/etc/os-release").file.read(String);
								if (
									string.indexOf("Amazon Linux 2") != -1
									|| string.indexOf("CentOS Linux 7 (Core)") != -1
								) {
									VERSION = "16.20.2";
								}
							}
							var now = node.object.at({ location: location.toString() });
							if (now && now.version == "v" + VERSION) {
								events.fire("found", now);
							} else {
								if (now) {
									var removed = {
										at: now.location,
										version: now.version
									}
									location.directory.remove();
									events.fire("removed", removed);
								}
								node.object.install({ version: VERSION, location: location })(events);
							}
						}
					};

					var exports = Object.assign(managed, node);

					return exports;

					// function update() {
					// 	jsh.shell.tools.node = Object.assign(
					// 		(
					// 			function() {
					// 				node.install({
					// 					location: location
					// 				})
					// 			}
					// 		)();
					// 		{
					// 			update: update,
					// 			require: require
					// 		}
					// 	);
					// }

					// function require() {
					// 	jsh.shell.jsh.require({
					// 		satisfied: function() {
					// 			return Boolean(jsh.shell.tools.node["version"])
					// 		},
					// 		install: function() {
					// 			jsh.shell.tools.node["install"]();
					// 		}
					// 	});
					// }

					// if (installed) {
					// 	//	TODO	update?
					// 	jsh.shell.tools.node = Object.assign(
					// 		installed,
					// 		{
					// 			update: update,
					// 			require: require
					// 		}
					// 	);
					// } else {
					// 	jsh.shell.tools.node = {
					// 		install: function(p) {
					// 			if (!p) p = {};
					// 			jsh.shell.tools.node = Object.assign(
					// 				node.install(
					// 					{
					// 						location: location,
					// 						update: p.update
					// 					},
					// 					{
					// 						console: function(e) {
					// 							jsh.shell.console(e.detail);
					// 						}
					// 					}
					// 				),
					// 				{ update: update, require: require }
					// 			)
					// 		},
					// 		require: require
					// 	};
					// }
					// if (jsh.shell.tools.node.installed.modules) {
					// 	/** @type { slime.jrunscript.node.Installation["modules"] } */
					// 	var modules = jsh.shell.tools.node.installed.modules;

					// 	var getVersion = function(p) {
					// 		if (!p) return void(0);
					// 		var now = modules.installed[p.name];
					// 		if (now.version) return now.version;
					// 		if (now.required && now.required.version) return now.required.version;
					// 	}

					// 	//	Wraps the existing require and makes it pertain to the entire shell. Not sure whether this is necessary;
					// 	//	maybe for something like TypeScript that is built into the shell itself?
					// 	modules.require = function(p) {
					// 		jsh.shell.jsh.require({
					// 			satisfied: function() {
					// 				var now = modules.installed[p.name];
					// 				if (!now) return false;
					// 				var version = getVersion({ name: p.name });
					// 				if (p.version) {
					// 					return version == p.version;
					// 				} else {
					// 					return true;
					// 				}
					// 			},
					// 			install: function() {
					// 				if (p.version) {
					// 					modules.install({
					// 						name: p.name + "@" + p.version
					// 					});
					// 				} else {
					// 					modules.install({
					// 						name: p.name
					// 					});
					// 				}
					// 			}
					// 		})
					// 	}
					// }
				})();

				jsh.tools.node = node;
			}
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,jsh,plugins,plugin,$loader)
