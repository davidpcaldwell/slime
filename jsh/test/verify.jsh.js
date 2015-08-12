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

//if (jsh.test && jsh.test.requireBuiltShell) {
//	jsh.test.requireBuiltShell();
//}
var parameters = jsh.script.getopts({
	options: {
		java: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		engine: jsh.script.getopts.ARRAY(String),
		slime: jsh.script.file.parent.parent.parent.pathname,
		tomcat: jsh.file.Pathname,
		browser: false,
		debug: false,
		view: "console"
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

var top = (function() {
	var view = (function(id) {
		if (id == "console") return new jsh.unit.view.Console({ writer: jsh.shell.stdio.output });
		if (id == "webview") return new jsh.unit.view.WebView();
	})(parameters.options.view)
	var rv = new jsh.unit.Suite({
		name: "SLIME verification suite",
		old: true
	});
	view.listen(rv);
	return rv;
})();

var subprocess = function(p) {
	if (!arguments.callee.index) arguments.callee.index = 0;
	arguments.callee.index++;
	top.scenario("subprocess-" + arguments.callee.index, jsh.unit.Suite.Fork(p));
}

parameters.options.java.forEach(function(jre) {
	//	TODO	Convert to jsh/test plugin API designed for this purpose
//	jsh.shell.echo("Adding launcher suite");
	var rhinoArgs = (jsh.shell.rhino && jsh.shell.rhino.classpath) ? ["-rhino", String(jsh.shell.rhino.classpath)] : [];
	top.scenario("launcher", jsh.unit.Suite.Fork({
		name: "Launcher remote suite",
		run: jsh.shell.jsh,
		fork: true,
		script: jsh.script.file.getRelativePath("launcher/suite.jsh.js").file,
		arguments: ["-scenario", "-view", "child"].concat(rhinoArgs)
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

			if (false) {
				subprocess({
					name: "Java tests: engine [" + engine + "]; launcher " + launcher,
					run: jsh.shell.run,
					command: launcher,
					arguments: [
						"-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
						parameters.options.slime.directory.getRelativePath("jsh/test/suite.jsh.js").toString(),
						"-stdio"
					],
					directory: parameters.options.slime.directory,
					environment: jsh.js.Object.set({}, jsh.shell.environment
						, (parameters.options.tomcat) ? { CATALINA_HOME: parameters.options.tomcat.toString() } : {}
						, (engine) ? { JSH_ENGINE: engine.toLowerCase() } : {}
					)
				});
			} else {
				subprocess({
					name: "Java tests: engine [" + engine + "]; launcher " + launcher,
					run: jsh.shell.run,
					command: launcher,
					arguments: launch.concat([
						parameters.options.slime.directory.getRelativePath("jsh/test/suite.jsh.js").toString(),
						"-stdio"
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
	})();
	if (!tomcat) {
		jsh.shell.echo("Skipping browser tests: Tomcat not found.");
	} else {
		subprocess({
			run: jsh.shell.jsh,
			name: "Browser tests",
	//		command: jsh.shell.java.jrunscript,
			script: parameters.options.slime.directory.getFile("jsh/test/browser.jsh.js"),
			arguments: [
	//			jsh.shell.jsh.home.getRelativePath("jsh.js"),
//				parameters.options.slime.directory.getRelativePath("jsh/test/browser.jsh.js").toString(),
				"-stdio"
			].concat(parameters.arguments),
			directory: parameters.options.slime.directory,
			environment: jsh.js.Object.set({}, jsh.shell.environment
				,{ CATALINA_HOME: tomcat }
			)
		});
	}
}

top.run();

jsh.shell.echo();
jsh.shell.echo("Finished at " + new Date());