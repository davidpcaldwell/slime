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
		rhino: jsh.file.Pathname,
		part: String,
		view: "console",
		"test:unbuilt": false
	}
});

if (jsh.test && jsh.test.requireBuiltShell && !parameters.options["test:unbuilt"]) {
	jsh.test.requireBuiltShell();
}

//	Built shells do not contain these plugins
jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("loader/api"));
jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("jsh/unit"));

var CATALINA_HOME = (function() {
	if (jsh.shell.environment.JSH_BUILD_TOMCAT_HOME) return jsh.file.Pathname(jsh.shell.environment.JSH_BUILD_TOMCAT_HOME).directory;
	if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
	if (jsh.shell.jsh.lib.getSubdirectory("tomcat")) return jsh.shell.jsh.lib.getSubdirectory("tomcat");
})();

var COFFEESCRIPT = jsh.shell.jsh.home.getFile("plugins/coffee-script.js");
if (!COFFEESCRIPT) {
	jsh.shell.console("CoffeeScript not present; CoffeeScript tests will be omitted.");
}

var src = parameters.options.src.directory;
var LOADER = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent });

var RHINO_LIBRARIES = (jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function") ? [jsh.shell.jsh.lib.getRelativePath("js.jar").java.adapt()] : null;

//	TODO	this next line should go elsewhere
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

scenario.part("jsh.shell", jsh.unit.part.Html({
	pathname: src.getRelativePath("rhino/shell/test/plugin.jsh.integration.api.html")
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

var ScriptVerifier = function(o) {
	var script = jsh.script.file.getRelativePath("../test/" + o.path).file;
	var tokens = [o.path].concat((o.arguments) ? o.arguments : []);
	scenario.part((o.name) ? o.name : tokens.join(" "), new function() {
		this.name = script.toString();

		this.execute = function(scope,verify) {
			jsh.shell.jsh({
				fork: true,
				script: script,
				arguments: (o.arguments) ? o.arguments : [],
				stdio: {
					output: String,
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
	ScriptVerifier({
		name: "remote",
		path: "launcher/remote.jsh.js",
		arguments: ["-trace:server"],
		environment: jsh.js.Object.set({}, jsh.shell.environment, (false) ? {
			JSH_DEBUG_SCRIPT: "rhino"
		} : {}),
		execute: function(verify) {
			verify(this.stdio.output.split(LINE_SEPARATOR))[0].is("true");
			verify(this.stdio.output.split(LINE_SEPARATOR))[1].is("true");
		}
	});
}

ScriptVerifier({
	path: "$api-deprecate-properties.jsh.js",
	execute: function(verify) {
		verify(this.stdio.output.split(LINE_SEPARATOR))[0].is("o.f.property = foo");
	}
});
ScriptVerifier({
	path: "jsh.shell/echo.jsh.js",
	execute: function(verify) {
		var output = this.stdio.output.split(LINE_SEPARATOR);
		verify(output)[0].is("true");
	}
});
ScriptVerifier({
	path: "jsh.shell/properties.jsh.js",
	execute: function(verify) {
		var output = this.stdio.output.split(LINE_SEPARATOR);
		verify(output)[0].is("Passed.");
	}
});

(function() {
	var input_abcdefghij = "ABCDEFGHIJ";
	ScriptVerifier({
		path: "jsh.shell/stdio.2.jsh.js",
		input: input_abcdefghij,
		execute: function(verify) {
			verify(this.stdio.output).is(input_abcdefghij);
		}
	});
	ScriptVerifier({
		path: "jsh.shell/stdio.3.jsh.js",
		input: input_abcdefghij,
		execute: function(verify) {
			verify(this.stdio.output).is(input_abcdefghij);
		}
	});
})();

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

if (CATALINA_HOME) {
	ScriptVerifier({
		path: "jsh.httpd/httpd.jsh.js",
		execute: function(verify) {
			verify(this).status.is(0);
		}
	});
	if (COFFEESCRIPT) {
		ScriptVerifier({
			path: "jsh.httpd/httpd.jsh.js",
			arguments: ["-suite", "coffee"],
			execute: function(verify) {
				verify(this).status.is(0);
			}
		});
	}
} else {
	jsh.shell.console("No CATALINA_HOME: not running httpd integration tests.");
}

var legacy = function() {
	//	TODO	remove the below dependency
	//			appears to define 'console'
	eval(jsh.script.file.parent.getFile("integration.api.rhino.js").read(String));

	var File = Packages.java.io.File;

	var JSH_HOME = jsh.shell.jsh.home.pathname.java.adapt();
	
	var getPath = function(basedir,relative) {
		var jfile = new File(basedir,relative);
		var rv = String(jfile.getCanonicalPath());
		if (platform.cygwin) {
			rv = platform.cygwin.cygpath.unix(rv);
		}
		return rv;
	};

	var getSourceFilePath = function(relative) {
		return getPath(SLIME_SRC, relative);
	}

	var SLIME_SRC = parameters.options.src.java.adapt();

	var LAUNCHER_COMMAND;
	if (!LAUNCHER_COMMAND) {
		var vmargs = [];
		//	TODO	this hard-coding of -client is not optimal but better than nothing
		vmargs.push("-client");
		if (getSystemProperty("jsh.suite.profile")) {
			vmargs = ["-javaagent:" + getPath(JSH_HOME, "tools/profiler.jar")]
		}
		LAUNCHER_COMMAND = [
			getPath(JAVA_HOME,"bin/java")
		].concat(vmargs).concat([
			"-jar",String(new Packages.java.io.File(JSH_HOME,"jsh.jar").getCanonicalPath())
		]);
	}

	var compileOptions;
	if (!compileOptions) {
		compileOptions = ["-g", "-nowarn"];
	}

	var mode = {};
	mode.env = {};
	for (var x in env) {
		if (!/^JSH_/.test(x)) {
			mode.env[x] = env[x];
		}
	}
	if (env.JSH_ENGINE) {
		mode.env.JSH_ENGINE = env.JSH_ENGINE;
	}
	if (env.JSH_SHELL_CONTAINER) {
		mode.env.JSH_SHELL_CONTAINER = env.JSH_SHELL_CONTAINER;
	}
	mode.env.JSH_PLUGINS = String(new File(JSH_HOME, "plugins").getCanonicalPath());
	if (debug.on) {
		mode.env.JSH_SCRIPT_DEBUGGER = "rhino";
	}

	var runCommand = function() {
		var p = {
			arguments: []
		};
		for (var i=0; i<arguments.length; i++) {
			if (i == 0) {
				p.command = arguments[i];
			} else if (i == arguments.length-1 && typeof(arguments[i]) == "object") {
				var mode = arguments[i];
				if (mode.env) {
					p.environment = mode.env;
				}
				if (typeof(mode.output) == "string") {
					if (!p.stdio) p.stdio = {};
					p.stdio.output = String;
				}
				if (typeof(mode.err) == "string") {
					if (!p.stdio) p.stdio = {};
					p.stdio.error = String;
				}
				if (typeof(mode.input) != "undefined") {
					p.stdio.input = jsh.io.java.adapt(mode.input);
				}
			} else {
				p.arguments.push(arguments[i]);
			}
		}
		p.evaluate = function(result) {
			if (typeof(mode.output) == "string") {
				mode.output += result.stdio.output;
			}
			if (typeof(mode.err) == "string") {
				mode.err += result.stdio.error;
			}
			return result.status;
		};
		return jsh.shell.run(p);
	}

	var run = function(command,mymode) {
		if (!mymode) mymode = mode;
		var options = mymode;
		console(command.join(" "));
		var status = runCommand.apply(this,command.concat(mymode));
	//	Packages.java.lang.System.err.println("env: " + JSON.stringify(env, void(0), "    "));
	//	Packages.java.lang.System.err.println("input: " + options.input);
	//	Packages.java.lang.System.err.println("Output: " + options.output);
	//	Packages.java.lang.System.err.println("Error: " + options.err);
		if (status != 0) {
			throw new Error("Failed with status: " + status + ": " + command.join(" "));
		} else {
			console("Passed: " + command.join(" "));
		}
	}

	var testCommandOutput = function(path,tester,p) {
		if (!p) p = {};
		var env = (function() {
			if (!p.env) return mode.env;
			var rv = {};
			for (var x in mode.env) {
				rv[x] = mode.env[x];
			}
			for (var x in p.env) {
				if (typeof(p.env[x]) != "undefined") {
					if (p.env[x] === null) {
						delete rv[x];
					} else {
						rv[x] = p.env[x];
					}
				}
			}
			return rv;
		})();
		var command = [
			String(new File(SLIME_SRC,"jsh/test/" + path).getCanonicalPath())
		];
		var launcher = LAUNCHER_COMMAND;
		if (p.arguments) {
			command = command.concat(p.arguments);
		}
		debug("Environment: " + JSON.stringify(env));
		var options = {
			output: "",
			err: "",
			env: env
		};
		if (p.stdin) {
			options.input = p.stdin;
		}

		console(launcher.concat(command).join(" "));
		var status = runCommand.apply(this,launcher.concat(command).concat([options]));
		if (status != 0) {
			Packages.java.lang.System.err.println("env: " + JSON.stringify(env, void(0), "    "));
			Packages.java.lang.System.err.println("input: " + options.input);
			Packages.java.lang.System.err.println("Output: " + options.output);
			Packages.java.lang.System.err.println("Error: " + options.err);
			throw new Error("Failed with exit status " + status + ": " + launcher.concat(command).join(" ") + " with options: " + options);
		}
		tester(options);
		console("");
		console("Passed: " + command.join(" "));
		console("");
	};

	(function() {
		var mymode = {
			env: {}
		};
		for (var x in mode.env) {
			mymode.env[x] = mode.env[x];
		}

		mymode.env.JSH_JAVA_LOGGING_PROPERTIES = String(new File(SLIME_SRC,"jsh/test/integration.logging.properties").getCanonicalPath());
		jsh.shell.echo("JSH_ENGINE = " + jsh.shell.environment.JSH_ENGINE);
		run(LAUNCHER_COMMAND.concat([
			getSourceFilePath("jsh/test/jsh.shell/properties.jsh.js")
		]), mymode);

		delete mymode.env.JSH_JAVA_LOGGING_PROPERTIES;
		var tmp = platform.io.createTemporaryDirectory();
		run(LAUNCHER_COMMAND.concat([
			getSourceFilePath("jsh/tools/slime.jsh.js"),
			"-from", getPath(SLIME_SRC,"loader/rhino/test/data/1"),
			"-to", getPath(tmp,"1.slime"),
			//	TODO	the below should match the version from the build
			"-version", "1.6"
		]));

		mymode.env.MODULES = tmp.getCanonicalPath();
	//	mymode.env.PATH = String(Packages.java.lang.System.getenv("PATH"));
		run(LAUNCHER_COMMAND.concat(
			[
				String(new File(SLIME_SRC,"jsh/test/loader/2.jsh.js").getCanonicalPath())
			]
		), mymode);
	})();

	testCommandOutput("loader/child.jsh.js", function(options) {
	});

	if (CATALINA_HOME) {
		console("Running httpd integration tests with CATALINA_HOME = " + CATALINA_HOME);
		var mymode = {};
		for (var x in mode) {
			if (x == "env") {
				if (!mymode.env) mymode.env = {};
				for (var y in mode.env) {
					mymode.env[y] = mode.env[y];
				}
			} else {
				mymode[x] = mode[x];
			}
		}
		mymode.env.CATALINA_HOME = CATALINA_HOME.pathname.toString();
		run(LAUNCHER_COMMAND.concat(
			[
				String(new File(SLIME_SRC,"jsh/test/jsh.httpd/httpd.jsh.js").getCanonicalPath())
			]
		),mymode);
		if (COFFEESCRIPT) {
			console("Running httpd CoffeeScript integration tests with CoffeeScript = " + COFFEESCRIPT);
			run(LAUNCHER_COMMAND.concat(
				[
					String(new File(SLIME_SRC,"jsh/test/jsh.httpd/httpd.jsh.js").getCanonicalPath()),
					"-suite", "coffee",
					"-coffeescript", COFFEESCRIPT
				]
			),mymode);
		}
	} else {
		console("No CATALINA_HOME: not running httpd integration tests.");
	}

	testCommandOutput("jsh.file/Searchpath.jsh.js", function(options) {
	});

	testCommandOutput("jsh.shell/stdio.1.jsh.js", function(options) {
		return options.output == "Hello, World!" && options.err == "Hello, tty!";
	});

	jsh.shell.run({
		command: LAUNCHER_COMMAND[0],
		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("jsh.script/loader.jsh.js")),
		stdio: {
			output: String
		},
		evaluate: function(result) {
			if (result.status == 0) {
				jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
				jsh.shell.echo();
			} else {
				throw new Error("Status: " + result.status);
			}
		}
	});

	jsh.shell.run({
		command: LAUNCHER_COMMAND[0],
		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("jsh.shell/jsh.shell.jsh.jsh.js"))
	});

	jsh.shell.run({
		command: LAUNCHER_COMMAND[0],
		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("jsh.shell/exit.jsh.js"))
	});

	if (RHINO_LIBRARIES) {
		jsh.shell.echo("Testing Rhino optimization ...");
		(function(level) {
			jsh.shell.jsh({
				fork: true,
				script: jsh.script.file.getRelativePath("../test/rhino-optimization.jsh.js").file,
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
					if (result.status == 0 && optimization == level) {
						jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
						jsh.shell.echo();
					} else {
						throw new Error("Status: " + result.status + " optimization " + optimization);
					}
				}
			});
		})(1);
	}

	if (CATALINA_HOME) {
		jsh.shell.echo("Testing launching script by URL ...");
		jsh.shell.jsh({
			fork: true,
			script: jsh.script.file.getRelativePath("../test/jsh.script/http.jsh.js"),
			stdio: {
				output: String
			},
			evaluate: function(result) {
				if (result.status == 0) {
					jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
					jsh.shell.echo();
				} else {
					throw new Error("Status: " + result.status);
				}
			}
		});
	}

	if (COFFEESCRIPT && !jsh.shell.environment.SKIP_COFFEESCRIPT) {
		jsh.shell.echo("Testing CoffeeScript ...");
		jsh.shell.jsh({
			fork: true,
			script: jsh.script.file.getRelativePath("../test/coffee/hello.jsh.coffee").file,
			stdio: {
				output: String
			},
			evaluate: function(result) {
				if (result.status == 0) {
					if (result.stdio.output == ["hello coffeescript world",""].join(String(Packages.java.lang.System.getProperty("line.separator")))) {
						jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
						jsh.shell.echo();
					} else {
						throw new Error("Output was [" + result.stdio.output + "]");
					}
				} else {
					throw new Error("Status: " + result.status);
				}
			}
		});
		jsh.shell.jsh({
			fork: true,
			script: jsh.script.file.getRelativePath("../test/coffee/loader.jsh.js").file,
			stdio: {
				output: String
			},
			evaluate: function(result) {
				if (result.status == 0) {
					jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
					jsh.shell.echo();
				} else {
					throw new Error("Status: " + result.status + " for " + result.command + " " + result.arguments.join(" "));
				}
			}
		});
	}

	var nativeLauncher = jsh.file.Searchpath([jsh.shell.jsh.home.pathname]).getCommand("jsh");
	//	Windows sees JavaScript files as potential commands, through the PATHEXT variable
	if (nativeLauncher && !/\.js/.test(nativeLauncher.pathname.basename)) {
		Packages.java.lang.System.err.println("Testing native launcher: " + nativeLauncher + " ...");
		jsh.shell.run({
			command: nativeLauncher,
			arguments: [jsh.script.file.getRelativePath("../test/jsh.shell/echo.jsh.js")],
			stdio: {
				output: String
			},
			evaluate: function(result) {
				if (result.status == 0) {
					if (result.stdio.output == ["true",""].join(String(Packages.java.lang.System.getProperty("line.separator")))) {
						jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
						jsh.shell.echo();
					} else {
						throw new Error("Wrong output: [" + result.stdio.output + "]");
					}
				} else {
					throw new Error("Exit status: [" + result.status + "]");
				}
			}
		});

		jsh.shell.run({
			command: "./jsh",
			arguments: [jsh.script.file.getRelativePath("../test/jsh.shell/echo.jsh.js")],
			stdio: {
				output: String
			},
			directory: jsh.shell.jsh.home,
			evaluate: function(result) {
				if (result.status == 0) {
					if (result.stdio.output == ["true",""].join(String(Packages.java.lang.System.getProperty("line.separator")))) {
						jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
						jsh.shell.echo();
					} else {
						throw new Error("Wrong output: [" + result.stdio.output + "]");
					}
				} else {
					throw new Error("Exit status: [" + result.status + "]");
				}
			}
		});

		var environment = jsh.js.Object.set({}, jsh.shell.environment);
		var PATH = jsh.file.Searchpath(jsh.shell.PATH.pathnames);
		PATH.pathnames.push(jsh.shell.jsh.home.pathname);
		var jshInPathCommand = {
			command: "jsh",
			arguments: [jsh.script.file.getRelativePath("../test/jsh.shell/echo.jsh.js")],
			stdio: {
				output: String
			},
			evaluate: function(result) {
				if (result.error) {
					jsh.shell.echo("error: " + result.error);
					jsh.shell.echo("error keys: " + Object.keys(result.error));
				}
				if (result.status == 0) {
					if (result.stdio.output == ["true",""].join(String(Packages.java.lang.System.getProperty("line.separator")))) {
						jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
						jsh.shell.echo();
					} else {
						throw new Error("Wrong output: [" + result.stdio.output + "]");
					}
				} else {
					throw new Error("Exit status: [" + result.status + "]");
				}
			}
		};
		var addShellToPath = (function() {
			if (false) {
				//	For some reason this does not work in Java; supplying the PATH to the subprocess does not mean that it will be
				//	used for resolving the given command
				return function(command,PATH) {
					var environment = jsh.js.Objet.set({}, jsh.shell.environment);
					environment.PATH = PATH.toString();
					command.environment = environment;
				};
			} else {
				return function(command,PATH) {
					//	TODO	should we quote this? What about spaces?
					command.arguments.unshift("PATH=" + PATH.toString(),command.command);
					command.command = "env";
				};
			}
		})();
		addShellToPath(jshInPathCommand,PATH);
		jsh.shell.run(jshInPathCommand);
	}
};

scenario.part("legacy", new function() {
	this.name = "Legacy tests";

	this.execute = function(scope,verify) {
		verify.test(function() {
			caught = false;
			try {
				legacy();
			} catch (e) {
				caught = e;
			}
			if (caught.printStackTrace) {
				caught.printStackTrace();
			}
			return {
				success: !caught,
				message: "caught error: " + caught,
				error: caught
			}
		});
	}
});

if (parameters.options.part) {
	//	TODO	this should probably be pushed farther down into the loader/api implementation
	scenario = (function recurse(scenario,path) {
		if (path.length) {
			var child = path.shift();
			return recurse(scenario.getParts()[child], path);
		}
		return scenario;
	})(scenario,parameters.options.part.split("/"));
}

jsh.unit.interface.create(scenario, new function() {
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	}
});
