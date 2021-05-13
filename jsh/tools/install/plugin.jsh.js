//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
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
	function($api,jsh,plugins,plugin,$loader) {
		plugin({
			isReady: function() {
				return jsh.js && jsh.js.web && jsh.java && jsh.ip && jsh.time && jsh.file && jsh.http && jsh.shell && jsh.java.tools;
			},
			load: function() {
				if (!jsh.tools) jsh.tools = {
					git: void(0),
					hg: void(0),
					node: void(0),
					install: void(0),
					github: void(0),
					gradle: void(0),

					//	deprecated
					rhino: void(0),
					tomcat: void(0),
					ncdbg: void(0)
				};
				jsh.tools.install = $loader.module("module.js", {
					api: {
						shell: jsh.shell,
						http: jsh.http,
						file: jsh.file,
						Error: jsh.js.Error
					},
					downloads: jsh.shell.user.downloads
				});

				/**
				 * @type { slime.jsh.shell.Exports["tools"]["rhino"]["install"] }
				 */
				var installRhino = $api.Events.Function(
					function(p,events) {
						if (!p) p = {};
						var lib = (p.mock && p.mock.lib) ? p.mock.lib : jsh.shell.jsh.lib;
						if (!jsh.shell.jsh.lib) throw new Error("Shell does not have lib");
						if (lib.getFile("js.jar") && !p.replace) {
							events.fire("console", "Rhino already installed at " + lib.getFile("js.jar"));
							return;
						}
						events.fire("console", "Installing Rhino ...");
						var operation = "copy";
						if (!p.local) {
							var jrunscript = {
								$api: {
									arguments: ["api"]
								}
							};
							//	TODO	push this back to jsh.shell as jsh.shell.jrunscript.api?
							var SRC = (function() {
								if (jsh.shell.jsh.home) return jsh.shell.jsh.home.getRelativePath("jsh.js");
								if (jsh.shell.jsh.src) return jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js");
							})();
							jsh.loader.run(
								SRC,
								{
									load: function() {
										//jsh.shell.console("load(" + Array.prototype.slice.call(arguments) + ")");
									}
								},
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
					graal: void(0),
					tomcat: void(0),
					ncdbg: void(0),
					kotlin: void(0),
					jsyaml: void(0),
					node: void(0),
					javamail: void(0),
					jsoup: void(0),
					postgresql: void(0),
					scala: void(0)
				};

				jsh.shell.tools.rhino = {
					install: installRhino,
					require: $api.Events.Function(function(p,events) {
						jsh.shell.jsh.require({
							satisfied: function() { return Boolean(jsh.shell.jsh.lib.getFile("js.jar")); },
							install: function() { return installRhino(p); }
						});
					})
				};

				(function deprecated() {
					jsh.tools.rhino = new function() {
						this.install = $api.deprecate(installRhino);
					};
					$api.deprecate(jsh.tools,"rhino");
					jsh.tools.install.rhino = {};
					jsh.tools.install.rhino.install = $api.deprecate(installRhino);
					$api.deprecate(jsh.tools.install,"rhino");
				})();

				var graal = new function() {
					var VERSION = {
						number: "20.3.0",
						edition: "ce"
					};
					this.install = $api.Events.Function(function(p,events) {
						if (jsh.shell.os.name == "Mac OS X") {
							jsh.tools.install.install({
								url: "https://github.com/graalvm/graalvm-ce-builds/releases/download/"
									+ "vm-" + VERSION.number + "/"
									+ "graalvm-" + VERSION.edition + "-" + "java8" + "-" + "darwin" + "-" + "amd64" + "-" + VERSION.number + ".tar.gz"
								,
								getDestinationPath: function(file) {
									return "graalvm-" + VERSION.edition + "-" + "java8" + "-" + VERSION.number;
								},
								to: jsh.shell.jsh.lib.getRelativePath("graal")
							});
						} else {
							throw new Error("Unsupported: os " + jsh.shell.os.name);
						}
					});
				};

				jsh.shell.tools.graal = graal;

				var tomcat = $loader.file("plugin.jsh.tomcat.js", {
					$api: jsh.tools.install.$api
				});
				jsh.shell.tools.tomcat = tomcat;

				(function deprecated() {
					jsh.tools.tomcat = tomcat;
					$api.deprecate(jsh.tools,"tomcat");
					jsh.tools.install.tomcat = tomcat;
					$api.deprecate(jsh.tools.install,"tomcat");
				})();

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

				var ncdbg = new function() {
					Object.defineProperty(this, "installed", {
						get: function() {
							return jsh.shell.jsh.lib.getSubdirectory("ncdbg");
						}
					});

					this.install = $api.Events.Function(function(p,events) {
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
							var remote = new jsh.tools.git.Repository({
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
							var distribution = src.directory.getSubdirectory("build/distributions").list()[0];
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

				var kotlin = (jsh.shell.jsh.lib) ? new function() {
					var location = jsh.shell.jsh.lib.getRelativePath("kotlin");

					this.install = $api.Events.Function(function(p,events) {
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
							arguments: function(rv) {
								rv.push("+x", location.directory.getRelativePath("bin/kotlinc"));
							}
						});
					});
				} : null;
				jsh.shell.tools.kotlin = kotlin;

				var scala = (jsh.shell.jsh.lib) ? new function() {
					var location = jsh.shell.jsh.lib.getRelativePath("scala");

					this.install = function() {
						if (location.directory) {
							location.directory.remove();
						}
						jsh.tools.install.install({
							url: "https://downloads.lightbend.com/scala/2.13.0/scala-2.13.0.tgz",
							to: location
						})
					};

					var Installation = function(o) {
						this.compile = function(p) {
							if (p.destination) p.destination.createDirectory({
								exists: function() {
									return false;
								}
							});
							return jsh.shell.run({
								command: o.directory.getFile("bin/scalac"),
								arguments: function(list) {
									if (p.deprecation) list.push("-deprecation");
									if (p.destination) list.push("-d", p.destination);
									list.push.apply(list,p.files);
								}
							})
						};

						this.run = function(p) {
							//	TODO	possibly could just use java command with location.directory.getRelativePath("lib/scala-library.jar")
							//			in classpath
							return jsh.shell.run({
								command: o.directory.getFile("bin/scala"),
								arguments: function(list) {
									if (p.classpath) list.push("-classpath", p.classpath);
									if (p.deprecation) list.push("-deprecation");
									list.push(p.main);
								}
							});
						}
					};

					Object.defineProperty(this, "installation", {
						get: function() {
							if (location.directory) {
								return new Installation({
									directory: location.directory
								});
							}
						}
					})
				} : null;
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

					rv.require = function(p) {
						jsh.shell.jsh.require({
							satisfied: function() { return Boolean(jsh.shell.jsh.lib.getFile("jsoup.jar")); },
							install: function() {
								return rv.install();
							}
						});
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
							jsh.shell.jsh.require({
								satisfied: function() { return Boolean(to.file); },
								install: install
							});
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
							}
						});

						if (location) this.require = function(p,on) {
							jsh.shell.jsh.require({
								satisfied: function() { return Boolean(location.file); },
								install: function() { install(); }
							}, on);
						}
					}
				}

				//	TODO	probably want to create a jrunscript/io version of this also, or even a loader/ version given that this
				//			is pure JavaScript
				jsh.shell.tools.jsyaml = new function() {
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
							var rv = eval(code);
							return global.jsyaml;
						})();
					}

					this.install = function() {
						if (!location) throw new Error("Cannot install js-yaml into this shell.");
						var code = fetchCode();
						location.write(code, { append: false });
						return load(code);
					};

					this.load = function() {
						var code = (location && location.file) ? location.file.read(String) : fetchCode();
						return load(code);
					}
				};

				jsh.tools.gradle = gradle;
			}
		});

		plugin({
			isReady: function() {
				return Boolean(plugins.node && jsh.file && jsh.shell && jsh.shell.tools && jsh.tools.install);
			},
			load: function() {
				/** @type { slime.jrunscript.node.Exports } */
				var node = plugins.node.module({
					context: {
						module: {
							file: jsh.file,
							shell: jsh.shell
						},
						library: {
							install: jsh.tools.install
						}
					}
				});

				(function integratedNode() {
					if (!jsh.shell.jsh.lib) return;

					var location = jsh.shell.jsh.lib.getRelativePath("node");

					/** @type { slime.jrunscript.node.Installation } */
					var installed = node.at({ location: location });

					function update() {
						jsh.shell.tools.node = Object.assign(
							node.install({
								location: location,
								update: true
							}),
							{
								update: update,
								require: require
							}
						);
					}

					function require() {
						jsh.shell.jsh.require({
							satisfied: function() {
								return Boolean(jsh.shell.tools.node["version"])
							},
							install: function() {
								jsh.shell.tools.node["install"]();
							}
						});
					};

					if (installed) {
						//	TODO	update?
						jsh.shell.tools.node = Object.assign(
							installed,
							{
								update: update,
								require: require
							}
						);
					} else {
						jsh.shell.tools.node = {
							install: function(p) {
								if (!p) p = {};
								jsh.shell.tools.node = Object.assign(
									node.install(
										{
											location: location,
											update: p.update
										},
										{
											console: function(e) {
												jsh.shell.console(e.detail);
											}
										}
									),
									{ update: update, require: require }
								)
							},
							require: require
						};
					}
					if (jsh.shell.tools.node["modules"]) {
						/** @type { slime.jrunscript.node.Installation["modules"] } */
						var modules = jsh.shell.tools.node["modules"];

						//	Wraps the existing require and makes it pertain to the entire shell. Not sure whether this is necessary;
						//	maybe for something like TypeScript that is built into the shell itself?
						modules.require = function(p) {
							jsh.shell.jsh.require({
								satisfied: function() {
									var now = modules.installed[p.name];
									if (!now) return false;
									if (p.version) {
										return now.version == p.version;
									} else {
										return true;
									}
								},
								install: function() {
									if (p.version) {
										modules.install({
											name: p.name + "@" + p.version
										});
									} else {
										modules.install({
											name: p.name
										});
									}
								}
							})
						}
					}
				})();

				jsh.tools.node = node;
			}
		});
	}
//@ts-ignore
)($api,jsh,plugins,plugin,$loader)
