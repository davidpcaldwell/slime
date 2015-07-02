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
//if (!jsh.shell.jsh.home) {
//	//	Relaunch in built shell
//	jsh.shell.echo("Relaunching in built shell ...");
//	var parameters = jsh.script.getopts({
//		options: {
//			native: false,
//			install: jsh.script.getopts.ARRAY(String),
//			downloads: jsh.file.Pathname,
//			rhino: jsh.file.Pathname
//		},
//		unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
//	});
//	var JSH_HOME = jsh.shell.TMPDIR.createTemporary({ directory: true });
//	//	TODO	locate jrunscript using Java home
//	//	TODO	add these APIs for properties, etc., to jsh.shell.jrunscript
//	var args = [];
//	if (parameters.options.downloads) {
//		args.push("-Djsh.build.downloads=" + parameters.options.downloads);
//	}
//	if (parameters.options.rhino) {
//		args.push("-Djsh.build.rhino.jar=" + parameters.options.rhino);
//	}
//	args.push("-Djsh.build.notest=true");
//	args.push("-Djsh.build.nodoc=true");
//	var SLIME = jsh.script.file.parent.parent.parent;
//	args.push(SLIME.getRelativePath("rhino/jrunscript/api.js"));
//	args.push(SLIME.getRelativePath("jsh/etc/build.rhino.js"));
//	args.push(JSH_HOME);
//	parameters.options.install.forEach(function(addon) {
//		args.push("-install", addon);
//	});
//	jsh.shell.run({
//		command: "jrunscript",
//		arguments: args
//	});
//	jsh.shell.echo("Launching with classpath " + jsh.shell.properties.get("jsh.launcher.classpath"));
//	jsh.shell.echo("Launching with arguments " + parameters.arguments);
//	jsh.shell.jsh({
//		fork: true,
//		shell: JSH_HOME,
//		script: jsh.script.file,
//		arguments: parameters.arguments,
//		evaluate: function(result) {
//			jsh.shell.exit(result.status);
//		}
//	});
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
//	var buffer = new jsh.io.Buffer();
//	var stream = jsh.shell.run(jsh.js.Object.set({}, p, {
//		stdio: {
//			output: buffer.writeBinary()
//		},
//		evaluate: function(result) {
//			buffer.close();
//			return buffer.readBinary();
//		}
//	}));
	top.add({
		scenario: new jsh.unit.Scenario.Fork(p)
	});
}

parameters.options.java.forEach(function(jre) {
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
		command: jsh.file.Searchpath([parameters.options.java[0].directory.getRelativePath("bin")]).getCommand("java"),
		arguments: [
			"-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
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