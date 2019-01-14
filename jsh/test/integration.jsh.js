//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2011-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		src: jsh.script.file.parent.parent.parent.pathname,
		part: String,
		view: "console",
		"test:unbuilt": false,
		executable: false
	}
});

if (jsh.test && jsh.test.requireBuiltShell && !parameters.options["test:unbuilt"]) {
	jsh.test.requireBuiltShell({
		executable: parameters.options.executable
	});
}


(function() {
	//	Built shells do not contain these plugins
	var SLIME = jsh.script.file.parent.parent.parent;
	jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
	jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));
})();

var CATALINA_HOME = (function() {
	if (jsh.shell.environment.JSH_BUILD_TOMCAT_HOME) return jsh.file.Pathname(jsh.shell.environment.JSH_BUILD_TOMCAT_HOME).directory;
	if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
	if (jsh.shell.jsh.lib.getSubdirectory("tomcat")) return jsh.shell.jsh.lib.getSubdirectory("tomcat");
})();

var COFFEESCRIPT = (jsh.shell.jsh.home) ? jsh.shell.jsh.home.getFile("plugins/coffee-script.js") : void(0);
if (!COFFEESCRIPT) {
	jsh.shell.console("CoffeeScript not present; CoffeeScript tests will be omitted.");
}

var src = parameters.options.src.directory;

var RHINO_LIBRARIES = (jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function") ? [jsh.shell.jsh.lib.getRelativePath("js.jar").java.adapt()] : null;

//	TODO	there is an undocumented API for this now
var LINE_SEPARATOR = String(Packages.java.lang.System.getProperty("line.separator"));

var scenario = new jsh.unit.Suite({
	name: "jsh Integration Tests"
});

scenario.part("coffeescript", {
	execute: function(scope,verify) {
		if (COFFEESCRIPT) {
			jsh.shell.echo("Testing CoffeeScript ...");
			var hello = jsh.shell.jsh({
				fork: true,
				script: jsh.script.file.getRelativePath("../test/coffee/hello.jsh.coffee").file,
				stdio: {
					output: String
				}
	//				,evaluate: function(result) {
	//					if (result.status == 0) {
	//						if (result.stdio.output == ["hello coffeescript world",""].join(String(Packages.java.lang.System.getProperty("line.separator")))) {
	//							jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
	//							jsh.shell.echo();
	//						} else {
	//							throw new Error("Output was [" + result.stdio.output + "]");
	//						}
	//					} else {
	//						throw new Error("Status: " + result.status);
	//					}
	//				}
				});
				verify(hello).status.is(0);
				verify(hello).stdio.output.is(["hello coffeescript world",""].join(String(Packages.java.lang.System.getProperty("line.separator"))));
				var loader = jsh.shell.jsh({
					fork: true,
					script: jsh.script.file.getRelativePath("../test/coffee/loader.jsh.js").file
	//				,evaluate: function(result) {
	//					if (result.status == 0) {
	//						jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
	//						jsh.shell.echo();
	//					} else {
	//						throw new Error("Status: " + result.status + " for " + result.command + " " + result.arguments.join(" "));
	//					}
	//				}
			});
			verify(loader).status.is(0);
		} else {
			verify("No CoffeeScript").is("No CoffeeScript");
		}
	}
});

(function addClasses() {
	var LOADER = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent });
	
	var compileAddClasses = jsh.js.constant(function() {
		var classes = jsh.shell.TMPDIR.createTemporary({ directory: true });
		jsh.shell.console("Compiling AddClasses ...");
		jsh.java.tools.javac({
			destination: classes.pathname,
			sourcepath: jsh.file.Searchpath([src.getRelativePath("jsh/loader/test/addClasses/java")]),
			arguments: [src.getRelativePath("jsh/loader/test/addClasses/java/test/AddClasses.java")]
		});
		return classes;
	});

	scenario.part("addClasses", {
		execute: function(scope,verify) {
			var result = jsh.shell.jsh({
				fork: true,
				script: src.getFile("jsh/loader/test/addClasses/addClasses.jsh.js"),
				arguments: ["-scenario"]
			});
			verify(result).status.is(0);
		}
	});
	//scenario.part("jsh.loader.java", {
	//	execute: function(scope,verify) {
	//		var result = jsh.shell.jsh({
	//			fork: true,
	//			script: src.getFile("jsh/loader/test/addClasses/addClasses.jsh.js"),
	//			arguments: ["-classes",compileAddClasses()]
	//		});
	//		verify(result).status.is(0);
	//	}
	//});

	scenario.part("packaged", LOADER.value("jsh/test/packaged/suite.js", {
		src: src,
		RHINO_LIBRARIES: RHINO_LIBRARIES,
		LINE_SEPARATOR: LINE_SEPARATOR,
		getClasses: compileAddClasses
	}));	
})()

jsh.unit.interface.create(scenario, new function() {
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	}

	this.path = (parameters.options.part) ? parameters.options.part.split("/") : [];
});
