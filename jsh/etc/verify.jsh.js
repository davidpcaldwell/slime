//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		java: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		engine: jsh.script.getopts.ARRAY(String),
		//	TODO	this parameter conflicts with the SLIME variable and both are used, so should resolve that
		slime: jsh.script.file.parent.parent.parent.pathname,
		tomcat: jsh.file.Pathname,
		browser: false,
		debug: false,
		view: "console",
		"chrome:profile": jsh.file.Pathname,
		port: Number,
		part: String
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!parameters.options.java.length) {
	parameters.options.java = [jsh.shell.java.home.pathname];
}

if (!parameters.options.engine.length) {
	parameters.options.engine = [""];
}

if (!parameters.options.slime) {
	jsh.shell.echo("Required: -slime");
	jsh.shell.exit(1);
}

if (!jsh.java.Thread && (parameters.options.chrome || parameters.options.firefox)) {
	jsh.shell.echo("Cannot run browser verification in shell without multithreading (use Rhino).");
	jsh.shell.exit(1);
}

var SLIME = jsh.script.file.parent.parent.parent;
jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));
jsh.loader.plugins(jsh.script.file.parent.pathname);

var top = new jsh.unit.Suite({
	name: "SLIME verification suite: " + SLIME
});

var subprocess = function(p) {
	if (!arguments.callee.index) arguments.callee.index = 0;
	arguments.callee.index++;
	top.part("subprocess-" + arguments.callee.index, jsh.unit.Suite.Fork(p));
}

var shells = {
	unbuilt: (jsh.shell.jsh.home) ? jsh.shell.jsh.home.getSubdirectory("src") : jsh.shell.jsh.src,
	built: (function() {
		if (jsh.shell.jsh.home) return jsh.shell.jsh.home;
		jsh.shell.console("Verify building shell to use with launcher tests ...");
		var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var buildArguments = [];
		if (jsh.shell.jsh.lib.getFile("js.jar")) {
			buildArguments.push("-rhino", jsh.shell.jsh.lib.getFile("js.jar"));
		}
		jsh.shell.run({
			command: jsh.shell.java.jrunscript,
			arguments: [
				jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
				"jsh",
				jsh.shell.jsh.src.getRelativePath("jsh/etc/build.jsh.js"),
				tmpdir,
				"-notest",
				"-nodoc"
			].concat(buildArguments),
			environment: jsh.js.Object.set({
				//	TODO	next two lines duplicate logic in jsh.test plugin
				TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
				PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
				PATH: jsh.shell.environment.PATH.toString()
			})
		});
		return tmpdir;
	})()
}

parameters.options.java.forEach(function(jre) {
	//	TODO	Convert to jsh/test plugin API designed for this purpose
//	jsh.shell.echo("Adding launcher suite");
	var rhinoArgs = (jsh.shell.jsh.lib.getFile("js.jar")) ? ["-rhino", jsh.shell.jsh.lib.getFile("js.jar")] : [];
	
	top.part("launcher", jsh.unit.Suite.Fork({
		name: "Launcher tests",
		run: jsh.shell.jsh,
		fork: true,
		script: jsh.script.file.getRelativePath("../test/launcher/suite.jsh.js").file,
		arguments: [
			"-scenario",
			"-shell:unbuilt", shells.unbuilt,
			"-shell:built", shells.built,
			"-view", "stdio"
		].concat(rhinoArgs)
	}));

	parameters.options.engine.forEach(function(engine) {
		var searchpath = jsh.file.Searchpath([jre.directory.getRelativePath("bin"),jre.directory.getRelativePath("../bin")]);

		var launcher = searchpath.getCommand("jrunscript");
		var launch = (jsh.shell.jsh.home) ? [jsh.shell.jsh.home.getRelativePath("jsh.js")] : [jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"), "jsh"];
		var engines = jsh.shell.run({
			command: launcher,
			arguments: launch.concat(["-engines"]),
			stdio: {
				output: String
			},
			evaluate: function(result) {
				return eval("(" + result.stdio.output + ")");
			}
		});

		if (engine && engines.indexOf(engine) == -1) {
			jsh.shell.echo("Skipping engine " + engine + "; not available under " + launcher);
		} else {
			jsh.shell.echo("Running " + jsh.shell.jsh.home + " with Java " + launcher + " and engine " + engine + " ...");

			if (true) {
				var environment = jsh.js.Object.set({}, jsh.shell.environment
					, (parameters.options.tomcat) ? { CATALINA_HOME: parameters.options.tomcat.toString() } : {}
					, (engine) ? { JSH_ENGINE: engine.toLowerCase() } : {}
					, (jsh.shell.rhino && jsh.shell.rhino.classpath) ? { JSH_ENGINE_RHINO_CLASSPATH: String(jsh.shell.rhino.classpath) } : ""
				);
				top.part("Java tests: engine [" + engine + "]; launcher " + launcher, {
					parts: {
						unit: jsh.unit.Suite.Fork({
							name: "Unit tests",
							run: jsh.shell.jsh,
							vmarguments: ["-Xms1024m"],
							shell: SLIME,
							script: SLIME.getFile("jsh/etc/unit.jsh.js"),
							arguments: [
								"-shell:built", shells.built,
								"-view", "stdio"
							],
							environment: environment
						}),
						integration: jsh.unit.Suite.Fork({
							name: "Integration tests",
							run: jsh.shell.jsh,
							//	Right now, integration tests require built shell
							shell: shells.built,
							script: SLIME.getFile("jsh/etc/integration.jsh.js"),
							arguments: (function() {
								var rv = [];
								if (jsh.shell.os.name == "Mac OS X") {
									rv.push("-executable");
								}
								rv.push("-view","stdio");
								return rv;
							})(),
							environment: environment
						})
					}
				});
			} else {
				subprocess({
					name: "Java tests: engine [" + engine + "]; launcher " + launcher,
					run: jsh.shell.run,
					command: launcher,
					arguments: launch.concat([
						parameters.options.slime.directory.getRelativePath("jsh/etc/suite.jsh.js").toString(),
						"-view", "stdio"
					]),
					directory: parameters.options.slime.directory,
					environment: jsh.js.Object.set({}, jsh.shell.environment
						, (parameters.options.tomcat) ? { CATALINA_HOME: parameters.options.tomcat.toString() } : {}
						, (engine) ? { JSH_ENGINE: engine.toLowerCase() } : {}
						, (jsh.shell.rhino && jsh.shell.rhino.classpath) ? { JSH_ENGINE_RHINO_CLASSPATH: String(jsh.shell.rhino.classpath) } : ""
					)
				});
			}
		}
	});
});

if (parameters.options.browser) {
	var tomcat = (function() {
		if (jsh.shell.jsh.lib.getSubdirectory("tomcat")) return jsh.shell.jsh.lib.getRelativePath("tomcat");
		if (parameters.options.tomcat) return parameters.options.tomcat;
		if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME);
	})();
	if (!tomcat) {
		jsh.shell.echo("Skipping browser tests: Tomcat not found.");
	} else {
		subprocess({
			run: jsh.shell.jsh,
			name: "Browser tests",
	//		command: jsh.shell.java.jrunscript,
			script: parameters.options.slime.directory.getFile("loader/browser/etc/unit.jsh.js"),
			arguments: [
	//			jsh.shell.jsh.home.getRelativePath("jsh.js"),
//				parameters.options.slime.directory.getRelativePath("jsh/test/browser.jsh.js").toString(),
				"-view", "stdio"
			].concat(parameters.arguments),
			directory: parameters.options.slime.directory,
			environment: jsh.js.Object.set({}, jsh.shell.environment
				,{ CATALINA_HOME: tomcat }
			)
		});
	}
}

jsh.unit.interface.create(top, new function() {
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	};
	
	this.path = (parameters.options.part) ? parameters.options.part.split("/") : void(0);
});
