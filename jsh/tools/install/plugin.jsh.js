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

plugin({
	isReady: function() {
		return jsh.js && jsh.js.web && jsh.java && jsh.ip && jsh.time && jsh.file && jsh.http && jsh.shell && jsh.java.tools && plugins.node;
	},
	load: function() {
		if (!jsh.tools) jsh.tools = {};
		jsh.tools.install = $loader.module("module.js", {
			api: {
				shell: jsh.shell,
				http: jsh.http,
				file: jsh.file,
				Error: jsh.js.Error
			},
			downloads: jsh.shell.user.downloads
		});

		var installRhino = jsh.tools.install.$api.Events.Function(function(p,events) {
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
				var _rhino = (p.mock && p.mock.rhino) ? p.mock.rhino.pathname.java.adapt() : jrunscript.$api.rhino.download();
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
		});

		jsh.shell.tools = {};

		jsh.shell.tools.rhino = {
			install: installRhino
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
				number: "19.2.1",
				edition: "ce"
			};
			this.install = $api.Events.Function(function(p,events) {
				if (jsh.shell.os.name == "Mac OS X") {
					jsh.tools.install.install({
						url: "https://github.com/oracle/graal/releases/download/"
							+ "vm-" + VERSION.number + "/" 
							+ "graalvm-" + VERSION.edition + "-" + "darwin" + "-" + "amd64" + "-" + VERSION.number + ".tar.gz"
						,
						getDestinationPath: function(file) {
							return "graalvm-" + VERSION.edition + "-" + VERSION.number + "/Contents/Home";
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
			var URL = "https://services.gradle.org/distributions/gradle-6.0.1-bin.zip";

			return new function() {
				this.install = function(p,events) {
					jsh.tools.install.install({
						url: URL,
						format: jsh.tools.install.format.zip,
						to: jsh.shell.jsh.lib.getRelativePath("gradle"),
						getDestinationPath: function(file) {
							return "gradle-6.0.1";
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
				if (!p.version) p.version = "0.8.3";
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
				var isReleasedVersion = ["0.8.0","0.8.1","0.8.2","0.8.3"].some(function(version) {
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
				var URL = "https://github.com/JetBrains/kotlin/releases/download/v1.3.31/kotlin-compiler-1.3.31.zip";

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
				
				var client = new jsh.http.Client();
				
				events.fire("console", "Adding jsr223.jar ...");
				var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
				TMP.getRelativePath("META-INF/services/javax.script.ScriptEngineFactory").write(
					"org.jetbrains.kotlin.script.jsr223.KotlinJsr223JvmLocalScriptEngineFactory",
					{ append: false, recursive: true }
				);
				jsh.io.archive.zip.encode({
					//  below call not easily deduced from documentation
					stream: location.directory.getRelativePath("lib/jsr223.jar").write(jsh.io.Streams.binary),
					//  below property not easily deduced from documentation
					entries: TMP.list({
						type: TMP.list.RESOURCE,
						filter: function(node) {
							return !node.directory;
						},
						descendants: function(directory) {
							return true;
						}
					})
				})
				
				events.fire("console", "Adding kotlin-script-util.jar ...");
				location.directory.getRelativePath("lib/kotlin-script-util.jar").write(client.request({
					url: "http://central.maven.org/maven2/org/jetbrains/kotlin/kotlin-script-util/1.3.31/kotlin-script-util-1.3.31.jar"
				}).body.stream, { append: false });

				jsh.shell.run({
					command: "chmod",
					arguments: function(rv) {
						rv.push("+x", location.directory.getRelativePath("bin/kotlinc"));
					}
				});
				// location.directory.getRelativePath("lib/kotlin-scripting-jvm-host.jar").write(new jsh.http.Client().request({
				//     url: "http://central.maven.org/maven2/org/jetbrains/kotlin/kotlin-scripting-jvm-host/1.3.31/kotlin-scripting-jvm-host-1.3.31.jar"
				// }).body.stream, { append: false });				
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

			return rv;
		})();

		jsh.shell.tools.javamail = {};
		jsh.shell.tools.javamail.install = function(p) {
			var to = jsh.shell.jsh.lib.getRelativePath("javamail.jar");
			if (!to.file) {
				//	Moving to https://projects.eclipse.org/projects/ee4j.javamail for version 1.6.3
				var response = new jsh.http.Client().request({
					url: "https://github.com/javaee/javamail/releases/download/JAVAMAIL-1_6_2/javax.mail.jar"
				});
				to.write(response.body.stream, { append: false });
			}
		};

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
						satisfied: function() { return location.file; },
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
					url: "https://raw.githubusercontent.com/nodeca/js-yaml/master/dist/js-yaml.js",
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

		var node = plugins.node.module();

		jsh.tools.node = node;

		(function integratedNode() {
			if (!jsh.shell.jsh.lib) return;
			
			var location = jsh.shell.jsh.lib.getRelativePath("node");

			if (location && location.directory) {
				var installation = new node.Installation({
					directory: location.directory
				});
				jsh.shell.tools.node = installation;
			} else {
				if (jsh.shell.jsh.lib) {
					jsh.shell.tools.node = {};
					jsh.shell.tools.node.install = $api.Events.Function(function(p,events) {
						if (!location.directory) {
							jsh.tools.install.install({
								url: "https://nodejs.org/dist/v10.16.0/node-v10.16.0-darwin-x64.tar.gz",
								to: location
							});
							events.fire("console", "Node installed.");
						} else {
							events.fire("console", "Node already installed.");
						}
						jsh.shell.tools.node = new node.Installation({
							directory: location.directory
						});
					}, {
						console: function(e) {
							jsh.shell.console(e.detail);
						}
					});
				}
			}
		})();
	}
});