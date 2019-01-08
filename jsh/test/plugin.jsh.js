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
		return jsh.js && jsh.script && jsh.shell;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};
		jsh.test.relaunchInDebugger = function(p) {
			for (var i=0; i<jsh.script.arguments.length; i++) {
				if (jsh.script.arguments[i] == p.argument) {
					var args = Array.prototype.slice.call(jsh.script.arguments);
					args.splice(i,1);
					var shell = (function() {
						if (jsh.shell.jsh.src) return jsh.shell.jsh.src;
						throw new Error("Unimplemented: relaunchInDebugger for non-unbuilt shell.");
					})();
					jsh.shell.jsh({
						shell: shell,
						script: jsh.script.file,
						arguments: args,
						environment: jsh.js.Object.set({}, jsh.shell.environment, {
							JSH_DEBUG_SCRIPT: "rhino"
						}),
						evaluate: function(result) {
							jsh.shell.exit(result.status);
						}
					});
				}
			}
		}
	}
})

plugin({
	isReady: function() {
		return jsh.js && jsh.io && jsh.shell && jsh.unit;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};

		jsh.test.Suite = function(p) {
			return new jsh.unit.Suite.Fork(jsh.js.Object.set({}, p, {
				run: jsh.shell.jsh,
				arguments: ["-scenario", "-view", "stdio"]
			}));
		};

		//	if -scenario is on command line, invokes scenario, otherwise run()
		//	scenario: receives a composite scenario as this, receives command-line arguments as function arguments, view argument
		//		[console/webview/child] determines format of scenario reporting
		//	run: receives processed results of getopts as argument
		jsh.test.integration = function(o) {
			var parameters = jsh.script.getopts({
				options: {
					scenario: false,
					part: String,
					view: "console"
				},
				unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
			});
			var getopts = (o.getopts) ? jsh.script.getopts(o.getopts, parameters.arguments) : { options: {}, arguments: parameters.arguments };
			if (parameters.options.scenario) {
				var scenario = new jsh.unit.Suite({
					name: jsh.script.file.pathname.basename
				});
				o.scenario.call(scenario,getopts);
				var path = (parameters.options.part) ? parameters.options.part.split("/") : void(0);
				jsh.unit.interface.create(scenario, { view: parameters.options.view, path: path });
			} else {
				o.run(getopts);
			}
		};
	}
});

plugin({
	isReady: function() {
		return jsh.shell && jsh.script;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};
		jsh.test.buildShell = function(p) {
			if (!p) p = {};
			if (!p.to) {
				p.to = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
				p.to.directory.remove();
			}
			jsh.shell.jsh({
				script: jsh.shell.jsh.src.getFile("jsh/etc/build.jsh.js"),
				arguments: (function(rv) {
					rv.push(p.to);
					rv.push("-notest", "-nodoc");
					if (jsh.shell.jsh.lib.getFile("js.jar")) {
						rv.push("-rhino",jsh.shell.jsh.lib.getFile("js.jar"));
					}
					return rv;
				})([])
			});
			return p.to.directory;
		}
		jsh.test.requireBuiltShell = function(p) {
			if (!jsh.shell.jsh.home) {
				jsh.shell.console("Building shell in which to relaunch " + jsh.script.file + " ...");
				//	TODO	this probably does not make sense; why do we require callers to have exactly these on the command line,
				//			with no prefixing or anything? Probably leftover cruft.
				var parameters = jsh.script.getopts({
					options: {
						executable: false,
						install: jsh.script.getopts.ARRAY(String),
						downloads: jsh.file.Pathname,
						rhino: jsh.file.Pathname
					},
					unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
				});
				if (p.rhino) {
					parameters.options.rhino = p.rhino;
				}
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
				var SLIME = (function(p) {
					if (p && p.src) return p.src;
					if (jsh.shell.jsh.home) return jsh.shell.jsh.home.getSubdirectory("src");
					return jsh.shell.jsh.src;
				})(p);
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
				//	TODO	probably not necessary; just relaunching should do this
				if (jsh.shell.jsh.lib.getSubdirectory("tomcat")) {
					jsh.shell.echo("Adding Tomcat to shell ...")
					environment.CATALINA_HOME = String(jsh.shell.jsh.lib.getSubdirectory("tomcat"));
				}
				jsh.shell.echo("Relaunching " + jsh.script.file + " with arguments " + parameters.arguments);
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

plugin({
	isReady: function() {
		return jsh.unit && jsh.unit.mock;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};
		jsh.test.mock = jsh.unit.mock;
		$api.deprecate(jsh.test,"mock");
	}
})
