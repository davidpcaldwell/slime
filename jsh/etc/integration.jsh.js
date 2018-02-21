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

//	Built shells do not contain these plugins
jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("loader/api"));
jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("jsh/unit"));

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
var LOADER = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent });

var RHINO_LIBRARIES = (jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function") ? [jsh.shell.jsh.lib.getRelativePath("js.jar").java.adapt()] : null;

//	TODO	there is an undocumented API for this now
var LINE_SEPARATOR = String(Packages.java.lang.System.getProperty("line.separator"));

var compileAddClasses = jsh.js.constant(function() {
	var classes = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.console("Compiling AddClasses ...");
	jsh.java.tools.javac({
		destination: classes.pathname,
		sourcepath: jsh.file.Searchpath([src.getRelativePath("jsh/test/addClasses/java")]),
		arguments: [src.getRelativePath("jsh/test/addClasses/java/test/AddClasses.java")]
	});
	return classes;
});

var scenario = new jsh.unit.Suite({
	name: "jsh Integration Tests"
});

scenario.part("jsh.shell.jsh", new jsh.unit.Suite.Fork({
	run: jsh.shell.jsh,
	script: src.getFile("rhino/shell/test/jsh.shell.jsh.suite.jsh.js"),
	arguments: ["-view","stdio"]
}));

scenario.part("jsh.loader.java", {
	execute: function(scope,verify) {
		var result = jsh.shell.jsh({
			fork: true,
			script: src.getFile("jsh/test/addClasses/addClasses.jsh.js"),
			arguments: ["-classes",compileAddClasses()]
		});
		verify(result).status.is(0);
	}
});

scenario.part("packaged", LOADER.value("jsh/test/packaged/suite.js", {
	src: src,
	RHINO_LIBRARIES: RHINO_LIBRARIES,
	LINE_SEPARATOR: LINE_SEPARATOR,
	getClasses: compileAddClasses
}));

var ScriptPart = function(o) {
	return new function() {
		this.name = o.script.toString();

		this.execute = function(scope,verify) {
			jsh.shell.jsh({
				fork: true,
				shell: o.shell,
				script: o.script,
				arguments: (o.arguments) ? o.arguments : [],
				stdio: {
					output: String,
					error: o.error,
					input: (o.input) ? o.input : null
				},
				environment: (o.environment) ? o.environment : jsh.shell.environment,
				evaluate: function(result) {
					o.check.call(result,verify);
				}
			});
		}
	};
}

var ScriptVerifier = function(o) {
	var script = jsh.script.file.getRelativePath("../test/" + o.path).file;
	var tokens = [o.path].concat((o.arguments) ? o.arguments : []);
	var parent = (o.parent) ? o.parent : scenario;
	parent.part((o.name) ? o.name : tokens.join(" "), new function() {
		if (!o.name) this.name = script.toString();

		this.execute = function(scope,verify) {
			jsh.shell.jsh({
				fork: true,
				script: script,
				arguments: (o.arguments) ? o.arguments : [],
				stdio: {
					output: String,
					error: o.error,
					input: (o.input) ? o.input : null
				},
				environment: (o.environment) ? o.environment : jsh.shell.environment,
				evaluate: function(result) {
					o.execute.call(result,verify);
				}
			});
		}
	});
};

if (CATALINA_HOME) {
	scenario.part("unit.browser", {
		name: "loader/browser/test",
		parts: {
			failure: {
				execute: function(scope,verify) {
					jsh.shell.jsh({
						fork: true,
						script: src.getFile("loader/api/ui/test/browser.jsh.js"),
						evaluate: function(result) {
							verify(result).status.is(0);
						}
					})
				}
			},
			success: {
				execute: function(scope,verify) {
					jsh.shell.jsh({
						fork: true,
						script: src.getFile("loader/api/ui/test/browser.jsh.js"),
						arguments: ["-success"],
						evaluate: function(result) {
							verify(result).status.is(0);
						}
					})
				}
			}
		}
	});
}

if (CATALINA_HOME) {
	ScriptVerifier({
		name: "remote",
		path: "launcher/remote.jsh.js",
		arguments: ["-trace:server"],
		environment: jsh.js.Object.set({}, jsh.shell.environment, (false) ? {
			JSH_DEBUG_SCRIPT: "rhino"
		} : {}),
//		error: null,
		execute: function(verify) {
			var lines = this.stdio.output.split(LINE_SEPARATOR);
			verify(lines.join("|")).is(lines.join("|"));
			verify(lines)[0].is("true");
			verify(lines)[1].is("true");
		}
	});
}

(function() {
	scenario.part("shell", {
		parts: {}
	});

	ScriptVerifier({
		parent: scenario.parts.shell,
		path: "jsh.shell/echo.jsh.js",
		execute: function(verify) {
			var output = this.stdio.output.split(LINE_SEPARATOR);
			verify(output)[0].is("true");
		}
	});

	ScriptVerifier({
		parent: scenario.parts.shell,
		path: "jsh.shell/properties.jsh.js",
		execute: function(verify) {
			var output = this.stdio.output.split(LINE_SEPARATOR);
			verify(output)[0].is("Passed.");
		}
	});


	//	testCommandOutput("jsh.shell/stdio.1.jsh.js", function(options) {
	//		return options.output == "Hello, World!" && options.err == "Hello, tty!";
	//	});
	ScriptVerifier({
		parent: scenario.parts.shell,
		path: "jsh.shell/stdio.1.jsh.js",
		error: String,
		execute: function(verify) {
			verify(this).stdio.output.is("Hello, World!");
			verify(this).stdio.error.is("Hello, tty!");
		}
	});

	(function() {
		var input_abcdefghij = "ABCDEFGHIJ";
		ScriptVerifier({
			parent: scenario.parts.shell,
			path: "jsh.shell/stdio.2.jsh.js",
			input: input_abcdefghij,
			execute: function(verify) {
				verify(this.stdio.output).is(input_abcdefghij);
			}
		});
		ScriptVerifier({
			parent: scenario.parts.shell,
			path: "jsh.shell/stdio.3.jsh.js",
			input: input_abcdefghij,
			execute: function(verify) {
				verify(this.stdio.output).is(input_abcdefghij);
			}
		});
	})();

	ScriptVerifier({
		parent: scenario.parts.shell,
		path: "jsh.shell/exit.jsh.js",
		execute: function(verify) {
			verify(this).status.is(0);
		}
	});

	ScriptVerifier({
		parent: scenario.parts.shell,
		path: "jsh.shell/jsh.shell.jsh.jsh.js",
		execute: function(verify) {
			verify(this).status.is(0);
		}
	});
})();

ScriptVerifier({
	path: "$api-deprecate-properties.jsh.js",
	execute: function(verify) {
		verify(this.stdio.output.split(LINE_SEPARATOR))[0].is("o.f.property = foo");
	}
});

ScriptVerifier({
	path: "jsh.shell/jsh.home.jsh.js",
	execute: function(verify) {
		var JSH_HOME = jsh.shell.jsh.home.pathname.java.adapt();
		verify(this.stdio.output.split(LINE_SEPARATOR))[0].is("jsh.home=" + JSH_HOME.getCanonicalPath() + Packages.java.io.File.separator);
	}
});

ScriptVerifier({
	path: "jsh.script/Application.jsh.js",
	arguments: ["-gstring", "gvalue", "-gboolean", "doIt", "-lboolean"],
	execute: function(verify) {
		var json = JSON.parse(this.stdio.output);
		verify(json).global.gstring.is("gvalue");
		verify(json).global.gboolean.is(true);
		verify(json).options.lboolean.is(true);
		verify(json).options.lstring.is("foo");
	}
});

ScriptVerifier({
	path: "loader/issue32.jsh.js",
	execute: function(verify) {
		var json = JSON.parse(this.stdio.output);
		verify(json).length.is(1);
		verify(json)[0].is("jsh");
	}
});

ScriptVerifier({
	path: "loader/child.jsh.js",
	execute: function(verify) {
		verify(this).status.is(0);
	}
});

if (CATALINA_HOME) {
	ScriptVerifier({
		name: "jsh.httpd",
		path: "jsh.httpd/httpd.jsh.js",
		execute: function(verify) {
			verify(this).status.is(0);
		}
	});
	if (COFFEESCRIPT) {
		ScriptVerifier({
			path: "jsh.httpd:coffee",
			arguments: ["-suite", "coffee"],
			execute: function(verify) {
				verify(this).status.is(0);
			}
		});
	}
} else {
	jsh.shell.console("No CATALINA_HOME: not running httpd integration tests.");
}

//		var tmp = platform.io.createTemporaryDirectory();
//		run(LAUNCHER_COMMAND.concat([
//			getSourceFilePath("jsh/tools/slime.jsh.js"),
//			"-from", getPath(SLIME_SRC,"loader/rhino/test/data/1"),
//			"-to", getPath(tmp,"1.slime"),
//			//	TODO	the below should match the version from the build
//			"-version", "1.6"
//		]));

scenario.part(".slime", {
	execute: function(scope,verify) {
		var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var builder = jsh.shell.jsh({
			fork: true,
			script: src.getFile("jsh/tools/slime.jsh.js"),
			arguments: [
				"-from", src.getRelativePath("loader/rhino/test/data/1"),
				"-to", tmp.getRelativePath("1.slime"),
				"-version", "1.6"
			]
		});
		verify(builder).status.is(0);
		var loader = jsh.shell.jsh({
			fork: true,
			script: src.getFile("jsh/test/loader/2.jsh.js"),
			environment: {
				MODULES: tmp.toString(),
				PATH: jsh.shell.environment.PATH
			}
		});
		verify(loader).status.is(0);
	}
});

ScriptVerifier({
	path: "jsh.file/Searchpath.jsh.js",
	execute: function(verify) {
		verify(this).status.is(0);
	}
});

//	jsh.shell.run({
//		command: LAUNCHER_COMMAND[0],
//		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("jsh.shell/jsh.shell.jsh.jsh.js"))
//	});
//
//	jsh.shell.run({
//		command: LAUNCHER_COMMAND[0],
//		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("jsh.shell/exit.jsh.js"))
//	});


//	jsh.shell.run({
//		command: LAUNCHER_COMMAND[0],
//		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("jsh.script/loader.jsh.js")),
//		stdio: {
//			output: String
//		},
//		evaluate: function(result) {
//			if (result.status == 0) {
//				jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
//				jsh.shell.echo();
//			} else {
//				throw new Error("Status: " + result.status);
//			}
//		}
//	});
//

ScriptVerifier({
	path: "jsh.script/loader.jsh.js",
	execute: function(verify) {
		verify(this).status.is(0);
	}
});

scenario.part("jsh.unit", {
	parts: {
		htmlReload: new ScriptPart({
			shell: src,
			script: src.getFile("jsh/unit/test/fail.jsh.js"),
			check: function(verify) {
				verify(this).status.is(1);
			}
		})
	}
});

scenario.part("rhino.optimization", {
	execute: function(scope,verify) {
		[-1,0,1].forEach(function(level) {
			jsh.shell.jsh({
				fork: true,
				script: src.getFile("jsh/test/rhino-optimization.jsh.js"),
				stdio: {
					output: String
				},
				environment: jsh.js.Object.set({}, jsh.shell.environment, {
					JSH_ENGINE: "rhino",
					JSH_ENGINE_RHINO_OPTIMIZATION: String(level)
				}),
				evaluate: function(result) {
					jsh.shell.echo("Output: [" + result.stdio.output + "]");
					var optimization = Number(result.stdio.output);
					verify(result).status.is(0);
					verify(optimization).is(level);
				}
			});
		});
	}
});

if (CATALINA_HOME) {
	ScriptVerifier({
		path: "jsh.script/http.jsh.js",
		execute: function(verify) {
			verify(this).status.is(0);
		}
	});
}

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

scenario.part("executable", new function() {
	var executable = (jsh.shell.jsh.home) ? jsh.file.Searchpath([jsh.shell.jsh.home.pathname]).getCommand("jsh") : null;
	if (executable) {
		this.parts = new function() {
			var echo = src.getRelativePath("jsh/test/jsh.shell/echo.jsh.js");
			var output = ["true",""].join(String(Packages.java.lang.System.getProperty("line.separator")));

			this.absolute = {
				execute: function(scope,verify) {
					var result = jsh.shell.run({
						command: executable,
						arguments: [echo],
						stdio: {
							output: String
						}
					});
					verify(result).status.is(0);
					verify(result).stdio.output.is(output);
				}
			};

			this.relative = {
				execute: function(scope,verify) {
					var result = jsh.shell.run({
						command: "./jsh",
						arguments: [echo],
						stdio: {
							output: String
						},
						directory: jsh.shell.jsh.home
					});
					verify(result).status.is(0);
					verify(result).stdio.output.is(output);
				}
			};

			this.PATH = {
				execute: function(scope,verify) {
					var PATH = (function() {
						var rv = jsh.file.Searchpath(jsh.shell.PATH.pathnames);
						rv.pathnames.push(jsh.shell.jsh.home.pathname);
						jsh.shell.console("PATH=" + rv);
						return rv.toString();
					})();
					var result = jsh.shell.run({
						command: "env",
						arguments: ["PATH=" + PATH, "jsh", echo],
						stdio: {
							output: String
						}
					});
					verify(result).status.is(0);
					verify(result).stdio.output.is(output);
				}
			}
		}
	} else {
		this.execute = function(scope,verify) {
			verify("No executable").is("No executable");
		}
	}
});

//if (parameters.options.part) {
//	//	TODO	this should probably be pushed farther down into the loader/api implementation
//	scenario = (function recurse(scenario,path) {
//		if (path.length) {
//			var child = path.shift();
//			return recurse(scenario.getParts()[child], path);
//		}
//		return scenario;
//	})(scenario,parameters.options.part.split("/"));
//}

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
