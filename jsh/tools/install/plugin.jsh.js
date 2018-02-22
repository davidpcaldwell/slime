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
		return jsh.js && jsh.js.web && jsh.java && jsh.ip && jsh.time && jsh.file && jsh.http && jsh.shell && plugins.slime && plugins.slime.tools && plugins.slime.tools.hg && jsh.tools.git;
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
							jsh.shell.console("load(" + Array.prototype.slice.call(arguments) + ")");
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
		jsh.tools.rhino = new function() {
			this.install = installRhino;
		};
		jsh.tools.install.rhino = {};
		$api.deprecate(jsh.tools.install,"rhino");
		jsh.tools.install.rhino.install = $api.deprecate(installRhino);

		var tomcat = $loader.file("plugin.jsh.tomcat.js", {
			$api: jsh.tools.install.$api
		});
		jsh.tools.tomcat = tomcat;
		jsh.tools.install.tomcat = tomcat;

		jsh.tools.ncdbg = new function() {
			Object.defineProperty(this, "installed", {
				get: function() {
					return jsh.shell.jsh.lib.getSubdirectory("ncdbg");
				}
			});

			this.install = function(p) {
				jsh.shell.console("Installing ncdbg ...");
				jsh.tools.install.install({
					url: "https://github.com/provegard/ncdbg/releases/download/0.6.0/ncdbg-0.6.0.zip",
					format: jsh.tools.install.format.zip,
					to: jsh.shell.jsh.lib.getRelativePath("ncdbg")
				});
				jsh.shell.run({
					command: "chmod",
					arguments: [
						"+x",
						jsh.shell.jsh.lib.getSubdirectory("ncdbg").getFile("bin/ncdbg")
					]
				});
			}
		};

		var loadHg = function() {
			jsh.tools.hg = $loader.file("hg.js", {
				api: {
					Installation: plugins.slime.tools.hg.Installation,
					shell: jsh.shell,
					Error: jsh.js.Error,
					install: jsh.tools.install,
					Events: {
						Function: jsh.tools.install.$api.Events.Function
					}
				}
			});

			if (jsh.shell.PATH.getCommand("hg")) {
				jsh.tools.hg.installation = new plugins.slime.tools.hg.Installation({
					install: jsh.shell.PATH.getCommand("hg")
				});
				global.hg = {};
				["Repository","init"].forEach(function(name) {
					jsh.tools.hg[name] = jsh.tools.hg.installation[name];
					global.hg[name] = jsh.tools.hg.installation[name];
				});
				$api.deprecate(global,"hg");
			}
		};

		var loadGit = function() {
			var installer = $loader.file("git.js", {
				module: plugins.slime.tools.git,
				api: {
					Events: {
						//	TODO	convert to standard form and get rid of this
						Function: jsh.tools.install.$api.Events.Function
					},
					Error: jsh.js.Error,
					shell: jsh.shell
				}
			});
			jsh.tools.git.install = installer.install;
			
			if (jsh.tools.git.installation) {
				//	TODO	enable credentialHelper for built shells
				//	TODO	investigate enabling credentialHelper for remote shells
				if (jsh.shell.jsh.src) {
					var credentialHelper = [
						jsh.shell.java.jrunscript.toString(),
						jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
						"jsh",
						jsh.shell.jsh.src.getRelativePath("rhino/tools/git/credential-helper.jsh.js")
					].join(" ");
					jsh.tools.git.credentialHelper.jsh = credentialHelper;
				}

				global.git = {};
				["Repository","init"].forEach(function(name) {
					global.git[name] = jsh.tools.git[name];
					$api.deprecate(global.git,name);
				});
				$api.deprecate(global,"git");
			}
		};

		loadHg();
		loadGit();

		jsh.java.tools.plugin = {
			//	TODO	this can now be accomplished by simply reloading the plugin
			hg: $api.deprecate(function() {
				loadHg();
			}),
			//	TODO	this can now be accomplished by simply reloading the plugin
			git: $api.deprecate(function() {
				loadGit();
			})
		};
	}
});