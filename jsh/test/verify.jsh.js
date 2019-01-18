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
		// TODO: browser argument obsolete; now included in unit.jsh.js test suite
		browser: false,
		debug: false,
		view: "console",
		"chrome:profile": jsh.file.Pathname,
		port: Number,
		part: String,
		noselfping: false
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

var COFFEESCRIPT = false;

if (!jsh.java.Thread && (parameters.options.chrome || parameters.options.firefox)) {
	jsh.shell.echo("Cannot run browser verification in shell without multithreading.");
	jsh.shell.exit(1);
}

var SLIME = jsh.script.file.parent.parent.parent;
jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));
jsh.loader.plugins(jsh.script.file.parent.pathname);

var top = new jsh.unit.Suite({
	name: "SLIME verification suite: " + SLIME
});

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
		jsh.shell.console("Installing Tomcat into built shell ...");
		jsh.shell.jsh({
			shell: tmpdir,
			script: tmpdir.getFile("src/jsh/tools/install/tomcat.jsh.js")
		});
		return tmpdir;
	})()
}

var engines = (function() {
	var rv = [];
	if (jsh.shell.jsh.lib.getFile("js.jar")) rv.push("rhino");
	if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) rv.push("nashorn");
	if (jsh.shell.jsh.lib.getSubdirectory("graal")) rv.push("graal");
	return rv;
})();

var jshPart = {
	parts: {}
};

engines.forEach(function(engine) {
	// TODO: add a part for an engine not present? Automatically install all engines when script is run?
	jshPart.parts[engine] = {
		execute: function(scope,verify) {
			// TODO: tests unbuilt shells only because built shells would not necessarily have the same libraries (Rhino/Graal).
			// will need to revisit this.
			// TODO: consider migrating to and combining with jsh/launcher/internal.api.html
			var output = jsh.shell.jsh({
				shell: shells.unbuilt,
				script: SLIME.getFile("jsh/test/jsh-data.jsh.js"),
				environment: Object.assign({}, jsh.shell.environment, {
					JSH_ENGINE: engine
				}),
				stdio: {
					output: String
				},
				evaluate: function(result) {
					return JSON.parse(result.stdio.output);
				}
			});
			verify(output).properties["jsh.engine"].is(engine);
			
			if (engine == "rhino") {
				[-1,0,1].forEach(function(level) {
					if (shells.unbuilt.getFile("local/jsh/lib/coffee-script.js")) {
						// TODO: If CoffeeScript is present, jsh should completely ignore optimization level
						jsh.shell.console("Skipping Rhino optimization tests for level " + level + "; CoffeeScript present.");
						return;
					}
					var result = jsh.shell.jsh({
						shell: shells.unbuilt,
						script: SLIME.getFile("jsh/test/jsh-data.jsh.js"),
						environment: jsh.js.Object.set({}, jsh.shell.environment, {
							JSH_ENGINE: "rhino",
							JSH_ENGINE_RHINO_OPTIMIZATION: String(level)
						}),
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return JSON.parse(result.stdio.output);
						}
					});
					verify(result).engines.current.name.is("rhino");
					verify(result).engines.current.optimization.is(level);
				});
			}
		}
	}
});

top.part("jsh", jshPart);

var javaPart = {
	parts: {}
};
var rhinoArgs = (jsh.shell.jsh.lib.getFile("js.jar")) ? ["-rhino", jsh.shell.jsh.lib.getFile("js.jar")] : [];

// TODO: this was intended to be used for each JRE, but was not implemented, so moving it outside the java loop for now
javaPart.parts.launcher = jsh.unit.Suite.Fork({
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
});


parameters.options.java.forEach(function(jre) {
	var jrePart = {
		parts: {}
	};
	javaPart.parts[jre.toString()] = jrePart;
	
	//	TODO	Convert to jsh/test plugin API designed for this purpose
//	jsh.shell.echo("Adding launcher suite");
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

			var environment = jsh.js.Object.set({}, jsh.shell.environment
				, (parameters.options.tomcat) ? { CATALINA_HOME: parameters.options.tomcat.toString() } : {}
				, (engine) ? { JSH_ENGINE: engine.toLowerCase() } : {}
				, (jsh.shell.rhino && jsh.shell.rhino.classpath) ? { JSH_ENGINE_RHINO_CLASSPATH: String(jsh.shell.rhino.classpath) } : ""
			);
			jrePart.parts[engine] = jsh.unit.Suite.Fork({
				name: "Java tests",
				run: jsh.shell.jsh,
				vmarguments: ["-Xms1024m"],
				shell: SLIME,
				script: jsh.script.file.parent.getFile("unit.jsh.js"),
				arguments: [
					"-shell:built", shells.built,
					"-view", "stdio"
				].concat(
					(parameters.options.noselfping) ? ["-noselfping"] : []
				),
				environment: environment
			})
		}
	});
});

top.part("jrunscript", javaPart);

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
