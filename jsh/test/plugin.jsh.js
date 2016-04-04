//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.io && jsh.shell && jsh.unit;
	},
	load: function() {
		var ForkScenario = function(p) {
			return new jsh.unit.Scenario({
				name: p.name,
				execute: function(scope) {
					p.method(jsh.js.Object.set({}, p, {
						evaluate: function(result) {
							scope.test(function() {
								return {
									success: !result.status,
									message: "Exit status " + result.status
								}
							});
						}
					}))
				}
			});
		}

		jsh.unit.CommandScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.run
			}));
		};
		jsh.unit.ScriptScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.jsh
			}));
		};
//		jsh.unit.Scenario.Integration = function(p) {
//			return new jsh.unit.Scenario.Fork(jsh.js.Object.set({}, p, {
//				run: jsh.shell.jsh,
//				arguments: ["-scenario", "-view", "child"]
//			}));
////			var buffer = new jsh.io.Buffer();
////			var write = buffer.writeBinary();
////			return jsh.shell.jsh({
////				fork: true,
////				shell: p.shell,
////				script: p.script,
////				arguments: ["-scenario", "-view", "child"],
////				stdio: {
////					output: write
////				},
////				evaluate: function(result) {
////					write.java.adapt().flush();
////					buffer.close();
////					return new jsh.unit.Scenario.Stream({
////						name: p.script.toString(),
////						stream: buffer.readBinary()
////					});
////				}
////			})
//		}

		jsh.unit.Suite.Integration = function(p) {
			return new jsh.unit.Suite.Fork(jsh.js.Object.set({}, p, {
				run: jsh.shell.jsh,
				arguments: ["-scenario", "-view", "stdio"]
			}));
		}

		//	if -scenario is on command line, invokes scenario, otherwise run()
		//	scenario: receives a composite scenario as this, receives command-line arguments as function arguments, view argument
		//		[console/webview/child] determines format of scenario reporting
		//	run: receives processed results of getopts as argument
		jsh.unit.integration = function(o) {
			var parameters = jsh.script.getopts({
				options: {
					scenario: false,
					view: "console"
				},
				unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
			});
			var getopts = (o.getopts) ? jsh.script.getopts(o.getopts, parameters.arguments) : { options: {}, arguments: parameters.arguments };
			if (parameters.options.scenario) {
//				var views = {
//					child: function() {
//						return new jsh.unit.view.Events({ writer: jsh.shell.stdio.output })
//					},
//					webview: function() {
//						return new jsh.unit.view.WebView()
//					},
//					console: function() {
//						return new jsh.unit.view.Console({ writer: jsh.shell.stdio.output })
//					}
//				};
//				var view = views[parameters.options.view]();
//				var view = jsh.unit.view.options.select(parameters.options.view);
				var scenario = new jsh.unit.Suite({
					name: jsh.script.file.pathname.basename//,
//					old: true
				});
				o.scenario.call(scenario,getopts);
//				view.listen(scenario);
//				scenario.run();
				jsh.unit.interface.create(scenario, { view: parameters.options.view });
			} else {
				o.run(getopts);
			}
		}
	}
});

plugin({
	isReady: function() {
		return jsh.shell && jsh.script;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};
		jsh.test.requireBuiltShell = function(p) {
			if (!jsh.shell.jsh.home) {
				jsh.shell.echo("Building shell in which to relaunch ...");
				var parameters = jsh.script.getopts({
					options: {
						executable: false,
						install: jsh.script.getopts.ARRAY(String),
						downloads: jsh.file.Pathname,
						rhino: jsh.file.Pathname
					},
					unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
				});
				var JSH_HOME = jsh.shell.TMPDIR.createTemporary({ directory: true });
				//	TODO	locate jrunscript using Java home
				//	TODO	add these APIs for properties, etc., to jsh.shell.jrunscript
				var args = [];
				if (parameters.options.downloads) {
					args.push("-Djsh.build.downloads=" + parameters.options.downloads);
				}
//				if (parameters.options.rhino) {
//					args.push("-Djsh.build.rhino.jar=" + parameters.options.rhino);
//				} else if (Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath")) {
//					args.push("-Djsh.engine.rhino.classpath=" + Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath"));
//				}
				var SLIME = (p && p.src) ? p.src : jsh.script.file.parent.parent.parent;
				args.push(SLIME.getRelativePath("rhino/jrunscript/api.js"));
				args.push("jsh");
				args.push(SLIME.getRelativePath("jsh/etc/build.jsh.js"));
				args.push(JSH_HOME);
				args.push("-notest");
				args.push("-nodoc");
				if (parameters.options.rhino) {
					args.push("-rhino", parameters.options.rhino);
				}
				if (parameters.options.executable) {
					args.push("-executable");
				}
				parameters.options.install.forEach(function(addon) {
					args.push("-install", addon);
				});
				jsh.shell.run({
					command: jsh.shell.java.jrunscript,
					arguments: args
				});
				var environment = {};
				for (var x in jsh.shell.environment) {
					environment[x] = jsh.shell.environment[x];
				}
				if (jsh.shell.jsh.lib.getSubdirectory("tomcat")) {
					jsh.shell.echo("Adding Tomcat to shell ...")
					environment.CATALINA_HOME = String(jsh.shell.jsh.lib.getSubdirectory("tomcat"));
				}
				jsh.shell.echo("Relaunching with arguments " + parameters.arguments);
				jsh.shell.jsh({
					fork: true,
					shell: JSH_HOME,
					environment: environment,
					script: jsh.script.file,
					arguments: parameters.arguments,
					evaluate: function(result) {
						jsh.shell.exit(result.status);
					}
				});

			}
		}
	}
});