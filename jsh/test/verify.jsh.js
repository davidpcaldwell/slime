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

if (jsh.test && jsh.test.requireBuiltShell) {
	jsh.test.requireBuiltShell();
}
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

var top = new jsh.unit.Scenario({
	composite: true,
	name: "SLIME verify",
	view: (function(id) {
		if (id == "console") return new jsh.unit.view.Console({ writer: jsh.shell.stdio.output });
		if (id == "webview") return new jsh.unit.view.WebView();
	})(parameters.options.view)
});

var CommandScenario = function(p) {
	return new jsh.unit.CommandScenario(jsh.js.Object.set({}, p, {
		name: p.arguments[2] + " " + p.command + " " + p.environment.JSH_ENGINE
	}));
};

var command = function(p) {
	top.add({ scenario: new CommandScenario(p) });
}

var subprocess = function(p) {
	top.add({
		scenario: new jsh.unit.Scenario.Fork(p)
	});
}

parameters.options.java.forEach(function(jre) {
	//	TODO	Convert to jsh/test plugin API designed for this purpose
	jsh.shell.echo("Adding launcher suite");
	top.add(new function() {
		var buffer = new jsh.io.Buffer();
		var write = buffer.writeBinary();
		var environment = jsh.js.Object.set({}, jsh.shell.environment);
		var rhinoArgs = (jsh.shell.rhino && jsh.shell.rhino.classpath) ? ["-rhino", String(jsh.shell.rhino.classpath)] : [];
		this.scenario = jsh.shell.jsh({
			fork: true,
			script: jsh.script.file.getRelativePath("launcher/suite.jsh.js").file,
			arguments: ["-scenario", "-view", "child"].concat(rhinoArgs),
			stdio: {
				output: write
			},
			evaluate: function(result) {
				jsh.shell.echo("Completed: launcher suite");
				write.java.adapt().flush();
				buffer.close();
				var rv = new jsh.unit.Scenario.Stream({
					name: jsh.script.file.getRelativePath("launcher/suite.jsh.js").toString(),
					stream: buffer.readBinary()
				});
				jsh.shell.echo("Returning launcher suite scenario");
				return rv;
			}
		});
	});

	parameters.options.engine.forEach(function(engine) {
		var searchpath = jsh.file.Searchpath([jre.directory.getRelativePath("bin")]);

		var launcher = searchpath.getCommand("java");
		var engines = jsh.shell.run({
			command: launcher,
			arguments: [
				"-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
				"-engines"
			],
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
					run: jsh.shell.jrunscript,
					arguments: [
						jsh.shell.jsh.home.getRelativePath("jsh.js"),
						parameters.options.slime.directory.getRelativePath("jsh/test/suite.jsh.js").toString(),
						"-stdio"
					],
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
	subprocess({
		run: jsh.shell.run,
		name: "Browser tests",
		command: jsh.shell.java.jrunscript,
		arguments: [
			jsh.shell.jsh.home.getRelativePath("jsh.js"),
			parameters.options.slime.directory.getRelativePath("jsh/test/browser.jsh.js").toString(),
			"-stdio"
		].concat(parameters.arguments),
		directory: parameters.options.slime.directory,
		environment: jsh.js.Object.set({}, jsh.shell.environment
			, (parameters.options.tomcat) ? { CATALINA_HOME: parameters.options.tomcat.toString() } : {}
		)
	});
}

top.run();

jsh.shell.echo();
jsh.shell.echo("Finished at " + new Date());