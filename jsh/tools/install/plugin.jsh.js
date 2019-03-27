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
		return jsh.js && jsh.js.web && jsh.java && jsh.ip && jsh.time && jsh.file && jsh.http && jsh.shell && jsh.java.tools;
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
				number: "1.0.0-rc10",
				edition: "ce"
			};
			this.install = $api.Events.Function(function(p,events) {
				if (jsh.shell.os.name == "Mac OS X") {
					jsh.tools.install.install({
						url: "https://github.com/oracle/graal/releases/download/vm-" + VERSION.number + "/" + "graalvm-" + VERSION.edition + "-" + VERSION.number + "-macos-amd64.tar.gz",
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

		jsh.shell.tools.jsoup = {};
		jsh.shell.tools.jsoup.install = function(p) {
			var to = jsh.shell.jsh.lib.getRelativePath("jsoup.jar");
			if (!to.file) {
				var response = new jsh.http.Client().request({
					url: "https://jsoup.org/packages/jsoup-1.11.3.jar"
				});
				to.write(response.body.stream, { append: false });
				//	TODO	the below code isn't very DRY; hits a special API for reloading rather than just reloading the plugin; at least this works for both
				//			unbuilt and built shells
				//	TODO	it is also untested
				jsh.loader.plugins(to);
				jsh.document.Document.Html.$reload();
			}
		};

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
			}

			this.install = function() {
				if (!location) throw new Error("Cannot install js-yaml into this shell.");
				location.write(fetchCode(), { append: false });				
			};

			this.load = function() {
				var code = (location && location.file) ? location.file.read(String) : fetchCode();
				return (function() {
					var global = {};
					var rv = eval(code);
					return global.jsyaml;
				})();
			}
		};

		(function deprecated() {
			jsh.tools.ncdbg = ncdbg;
			$api.deprecate(jsh.tools,"ncdbg");
		})();
	}
});