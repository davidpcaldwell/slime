//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	//	TODO	it does not make much sense to check for jsh.shell in .isReady() and then not pass it to the plugin. Is this
	//			method of running the compiler obsolete?
	isReady: function() {
		return typeof(jsh.js) != "undefined" && typeof(jsh.java) != "undefined"
			&& (
				Packages.javax.tools.ToolProvider.getSystemToolClassLoader() != null
				|| jsh.shell && jsh.file.Searchpath([ jsh.shell.java.home.getRelativePath("bin") ]).getCommand("javac")
			)
		;
	},
	load: function() {
		jsh.java.tools = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: jsh.java
			}
		});
	}
});

plugin({
	isReady: function() {
		return jsh.js && jsh.js.web && jsh.time && jsh.java && jsh.ip && jsh.file && jsh.shell && jsh.tools && jsh.tools.install && jsh.java.tools;
	},
	load: function() {
		var loadHg = function() {
			var module = $loader.module("hg/module.js", {
				api: {
					js: jsh.js,
					time: jsh.time,
					web: jsh.js.web,
					java: jsh.java,
					ip: jsh.ip,
					file: jsh.file,
					shell: jsh.shell
				}
			});

			jsh.tools.hg = $loader.file("hg/install.js", {
				api: {
					module: module,
					shell: jsh.shell,
					java: {
						tools: jsh.java.tools
					},
					Error: jsh.js.Error,
					install: jsh.tools.install,
					Events: {
						Function: jsh.tools.install.$api.Events.Function
					}
				}
			});

			if (jsh.tools.hg.installation) {
				global.hg = {};
				["Repository","init"].forEach(function(name) {
					global.hg[name] = jsh.tools.hg[name];
					$api.deprecate(global.hg,name);
				});
				$api.deprecate(global,"hg");
			}
		};


		loadHg();

		if (!jsh.java.tools.plugin) jsh.java.tools.plugin = {};
		jsh.java.tools.plugin.hg = $api.deprecate(function() {
			loadHg();
		});

		var loadGit = function() {
			jsh.tools.git = $loader.module("git/module.js", {
				api: {
					js: jsh.js,
					java: {
						Thread: jsh.java.Thread
					},
					time: jsh.time,
					file: jsh.file,
					shell: jsh.shell,
					ip: jsh.ip,
					Events: {
						//	TODO	convert to standard form and get rid of this
						Function: jsh.tools.install.$api.Events.Function
					},
					Error: jsh.js.Error
				}
			});
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
		loadGit();

		//	TODO	provide alternate means of loading the plugin
		if (!jsh.java.tools.plugin) jsh.java.tools.plugin = {};
		jsh.java.tools.plugin.git = $api.deprecate(function() {
			loadGit();
		});

		jsh.tools.node = $loader.module("node/module.js");
	}
});

plugin({
	isReady: function() {
		//	TODO	cannot load postgresql driver under Nashorn presently; uses E4X
		return jsh.shell && jsh.shell.jsh && jsh.shell.jsh.lib /*&& String(Packages.java.lang.System.getProperty("jsh.engine")) == "rhino"*/;
	},
	load: function() {
		var postgresql = jsh.shell.jsh.lib.getRelativePath("postgresql.jar");
		if (postgresql.file) {
			jsh.loader.java.add(postgresql);
		}
		jsh.loader.plugins(new $loader.Child("db/jdbc/"));
	}
});
