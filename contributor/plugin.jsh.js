//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.plugin.Scope["$loader"] } $loader
	 * @param { slime.jsh.plugin.Scope["plugin"]} plugin
	 * @param { Pick<slime.jsh.plugin.Scope["jsh"],"loader"|"java"|"shell"|"file"|"script"|"tools"|"wf"|"unit"|"project"> } jsh
	 */
	function(Packages,$api,$loader,plugin,jsh) {
		$loader.plugin("code/");
		$loader.plugin("dependencies/");

		plugin({
			isReady: function() { return Boolean(jsh.unit) && Boolean(jsh.project); },
			load: function() {
				var code = {
					/** @type { slime.project.internal.jrunscript_environment.Script } */
					Environment: $loader.script("jrunscript-environment.js")
				};

				var Environment = code.Environment({
					//@ts-ignore
					jsh: jsh
				});

				jsh.project.suite = {
					initialize: void(0),
					Environment: void(0),
					run: void(0)
				}

				jsh.project.suite.initialize = function(p) {
					jsh.shell.tools.rhino.require.simple();

					var TOMCAT_ATTEMPTS = 5;
					var TOMCAT_RETRY_INTERVAL = 60;
					for (var i=0; i<TOMCAT_ATTEMPTS; i++) {
						try {
							jsh.shell.tools.tomcat.jsh.require.simple();
						} catch (e) {
							jsh.shell.console("Tomcat installation failed.");
							if (i != (TOMCAT_ATTEMPTS - 1)) {
								jsh.shell.console("Waiting " + TOMCAT_RETRY_INTERVAL + " seconds for retry ...");
								Packages.java.lang.Thread.sleep(TOMCAT_RETRY_INTERVAL * 1000);
								jsh.shell.console("Retrying Tomcat installation ...");
							}
						}
					}
					//	TODO	should have a better way of dealing with this, but for now we just reload the plugin that depended on Tomcat
					//			and it will succeed now.
					jsh.loader.plugins(jsh.script.file.parent.parent.getRelativePath("loader/api/old/jsh"));

					jsh.wf.typescript.require();

					if (p.selenium) {
						var selenium = (function() {
							var SELENIUM = jsh.shell.jsh.lib.getRelativePath("selenium/java");
							return {
								satisfied: function() {
									return Boolean(SELENIUM.directory);
								},
								install: function() {
									jsh.shell.console("Installing Selenium Java driver ...");
									jsh.tools.install.install({
										url: "https://github.com/SeleniumHQ/selenium/releases/download/selenium-4.1.0/selenium-java-4.1.3.zip",
										getDestinationPath: function(file) { return ""; },
										to: SELENIUM
									});
								}
							}
						})();

						$api.fp.now(
							selenium,
							jsh.shell.jsh.require,
							$api.fp.world.events.ignore.action,
							$api.fp.impure.Process.now
						)
					}

					jsh.java.Thread.start(
						/**
						 * At one point, builds were failing on Docker because `tsc` was not found when attempting to use TypeScript within
						 * tests. `tsc` would blink in and out of existence in the shell's library directory.
						 *
						 * This seems to be no longer happening.
						 *
						 * This function runs a thread that monitors the existence of the TypeScript compiler in the test suite shell and
						 * writes console messages if its status changes (it is removed, it reappears, etc.)
						 */
						function addDiagnosticForTscDisappearing() {
							/** @type { boolean } */
							var found;

							/** @type { boolean } */
							var now;

							while(true) {
								now = jsh.shell.jsh.src.getRelativePath("local/jsh/lib/node/bin/tsc").java.adapt().exists();
								if (typeof(found) == "undefined") {
									jsh.shell.console("Initial check: tsc found = " + now);
								} else if (found && !now) {
									jsh.shell.console("tsc change: removed");
									jsh.shell.console("node present? " + jsh.shell.jsh.src.getRelativePath("local/jsh/lib/node").java.adapt().exists());
								} else if (!found && now) {
									jsh.shell.console("tsc change: added");
								} else {
									//jsh.shell.console("tsc still " + now);
								}
								found = now;
								jsh.java.Thread.sleep(25);
							}
						}
					);
				};

				jsh.project.suite.Environment = Environment;

				jsh.project.suite.run = function(p) {
					//	TODO	push below back to plugin
					jsh.unit.interface.create(p.suite.build(), new function() {
						if (p.view == "chrome") {
							this.chrome = {
								profile: p["chrome:profile"],
								port: p.port
							};
						} else {
							this.view = p.view;
						}

						this.path = (p.part) ? p.part.split("/") : void(0);
					});
				}
			}
		})
	}
//@ts-ignore
)(Packages,$api,$loader,plugin,jsh);
