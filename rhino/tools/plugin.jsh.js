//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.plugins } plugins
	 * @param { slime.jsh.plugin.plugin } plugin
	 * @param { slime.Loader } $loader
	 */
	function(Packages,$api,jsh,plugins,plugin,$loader) {
		plugin({
			//	TODO	it does not make much sense to check for jsh.shell in .isReady() and then not pass it to the plugin. Is this
			//			method of running the compiler obsolete?
			isReady: function() {
				return typeof(jsh.js) != "undefined" && typeof(jsh.java) != "undefined"
					&& (
						Packages.javax.tools.ToolProvider.getSystemToolClassLoader() != null
						|| Boolean(jsh.shell && jsh.file.Searchpath([ jsh.shell.java.home.getRelativePath("bin") ]).getCommand("javac"))
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
				return true;
			},
			load: function() {
				plugins.node = {
					module: function(p) {
						return $loader.module("node/module.js", p.context);
					}
				};
			}
		});

		var loadGit = function() {
			jsh.loader.plugins($loader.Child("git/"));
		};

		plugin({
			isReady: function() {
				return jsh.js && jsh.time && jsh.web && jsh.java && jsh.ip && jsh.file && jsh.shell && jsh.tools && jsh.tools.install && jsh.java.tools;
			},
			load: function() {
				//	TODO	we are duplicating the isReady() logic both here and in the git plugin
				loadGit();

				var loadHg = function() {
					var module = $loader.module("hg/module.js", {
						api: {
							js: jsh.js,
							time: jsh.time,
							web: jsh.web,
							java: jsh.java,
							ip: jsh.ip,
							file: jsh.file,
							shell: jsh.shell,
							git: jsh.tools.git
						}
					});

					jsh.tools.hg = $loader.file("hg/install.js", {
						api: {
							module: module,
							shell: jsh.shell,
							ui: jsh.ui,
							Error: jsh.js.Error,
							install: jsh.tools.install,
							Events: {
								Function: jsh.tools.install.$api.Events.Function
							}
						}
					});

					if (jsh.tools.hg.installation) {
						global["hg"] = {};
						["Repository","init"].forEach(function(name) {
							global["hg"][name] = jsh.tools.hg[name];
							$api.deprecate(global["hg"],name);
						});
						$api.deprecate(global,"hg");
					}
				};


				loadHg();

				if (!jsh.java.tools.plugin) jsh.java.tools.plugin = {};
				jsh.java.tools.plugin.hg = $api.deprecate(function() {
					loadHg();
				});

				//	TODO	provide alternate means of loading the plugin
				if (!jsh.java.tools.plugin) jsh.java.tools.plugin = {};
				jsh.java.tools.plugin.git = $api.deprecate(function() {
					loadGit();
				});
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.shell && jsh.tools);
			},
			load: function() {
				jsh.loader.plugins($loader.Child("docker/"));
			}
		})

		plugin({
			isReady: function() {
				return Boolean(jsh.http && jsh.shell && jsh.tools);
			},
			load: function() {
				/** @type { slime.jrunscript.tools.github.Script } */
				var script = $loader.script("github/module.js");
				jsh.tools.github = script({
					library: {
						web: jsh.web,
						io: jsh.io,
						http: jsh.http,
						shell: jsh.shell
					}
				});
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.unit && jsh.unit.mock && jsh.unit.mock.Web);
			},
			load: function() {
				jsh.loader.plugins($loader.Child("github/"));
			}
		});

		plugin({
			isReady: function() {
				//	TODO	cannot load postgresql driver under Nashorn presently; uses E4X
				return Boolean(jsh.shell && jsh.shell.jsh && jsh.shell.jsh.lib) /*&& String(Packages.java.lang.System.getProperty("jsh.engine")) == "rhino"*/;
			},
			load: function() {
				var postgresql = jsh.shell.jsh.lib.getRelativePath("postgresql.jar");
				if (postgresql.file) {
					jsh.loader.java.add(postgresql);
				}
				jsh.loader.plugins($loader.Child("db/jdbc/"));
			}
		});
	}
//@ts-ignore
)(Packages,$api,jsh,plugins,plugin,$loader);
