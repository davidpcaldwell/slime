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

if (jsh.test && jsh.test.requireBuiltShell) {
	jsh.test.requireBuiltShell();
}
var parameters = jsh.script.getopts({
	options: {
		src: jsh.script.file.getRelativePath("../.."),
		rhino: jsh.file.Pathname,
		part: String,
		view: "console"
	}
});

//	Built shells do not contain these plugins
jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("loader/api"));
jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("jsh/unit"));

var CATALINA_HOME = (function() {
	if (jsh.shell.environment.JSH_BUILD_TOMCAT_HOME) return jsh.file.Pathname(jsh.shell.environment.JSH_BUILD_TOMCAT_HOME).directory;
	if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
	if (jsh.shell.jsh.home.getSubdirectory("lib/tomcat")) return jsh.shell.jsh.home.getSubdirectory("lib/tomcat");
})();

var src = parameters.options.src.directory;

var scenario = new jsh.unit.Suite({
	name: "jsh Integration Tests"
});

scenario.part("jsh.shell", jsh.unit.part.Html({
	pathname: src.getRelativePath("rhino/shell/test/plugin.jsh.integration.api.html")
}));

//	TODO	this next line should go elsewhere
var LINE_SEPARATOR = String(Packages.java.lang.System.getProperty("line.separator"));

var ScriptVerifier = function(o) {
	var script = jsh.script.file.getRelativePath("../test/" + o.path).file;
	var tokens = [o.path].concat((o.arguments) ? o.arguments : []);
	scenario.scenario((o.name) ? o.name : tokens.join(" "), {
		create: function() {
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
	path: "plugins/packaged.jsh.js",
	environment: {
		LOAD_JSH_PLUGIN_TEST_PLUGIN: "true"
	},
	execute: function(verify) {
		var output = this.stdio.output.split(LINE_SEPARATOR);
		verify(output)[0].is("a: Hello, World!");
		verify(output)[1].is("[global] a: Hello, World!");
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

var RHINO_LIBRARIES = (jsh.shell.jsh.home.getFile("lib/js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function") ? [jsh.shell.jsh.home.getRelativePath("lib/js.jar").java.adapt()] : null;

var LOADER = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent });
scenario.part("packaged", LOADER.value("jsh/test/packaged/suite.js", {
	src: src,
	RHINO_LIBRARIES: RHINO_LIBRARIES
}));

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
	console("No CATALINA_HOME: not running httpd integration tests.");
}

//	TODO	remove the below dependency
//			appears to define 'console'
eval(jsh.script.file.parent.getFile("integration.api.rhino.js").read(String));

var File = Packages.java.io.File;

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

var JSH_HOME = jsh.shell.jsh.home.pathname.java.adapt();
var COFFEESCRIPT = jsh.shell.jsh.home.getFile("plugins/coffee-script.js");
if (!COFFEESCRIPT) {
	jsh.shell.echo("Skipping CoffeeScript tests; CoffeeScript not present.");
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

var PACKAGED_LAUNCHER = (function() {
	var command = [];
	command.push(getPath(JAVA_HOME,"bin/java"));
	command.push("-jar");
	return command;
})();

var runPackaged = function() {
	var command = PACKAGED_LAUNCHER.slice(0);
	for (var i=0; i<arguments.length-1; i++) {
		command.push(arguments[i]);
	}
	var mode;
	if (typeof(arguments[arguments.length-1]) == "string") {
		command.push(arguments[arguments.length-1]);
	} else {
		mode = arguments[arguments.length-1];
	}
	run(command,mode);
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
	var launcher;
	var command;
	if (typeof(path) == "string") {
		command = [
			String(new File(SLIME_SRC,"jsh/test/" + path).getCanonicalPath())
		];
		launcher = LAUNCHER_COMMAND;
	} else {
		command = [
			String(path.getCanonicalPath())
		];
		launcher = PACKAGED_LAUNCHER;
	}
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

var checkOutput = function(options,messages) {
	var expected = messages.join(String(Packages.java.lang.System.getProperty("line.separator")));
	if (options.output != expected) {
		Packages.java.lang.System.err.println("Output wrong:");
		Packages.java.lang.System.err.println("Expected:");
		Packages.java.lang.System.err.println(expected);
		Packages.java.lang.System.err.println("Actual:");
		Packages.java.lang.System.err.println(options.output);
		Packages.java.lang.System.err.println("Output wrong; dumping stderr:");
		Packages.java.lang.System.err.println(options.err);
		throw new Error("Output wrong: it is [" + options.output + "] when expected was [" + expected + "]");
	}
}

var getJshPathname = function(file) {
	var rv = String(file.getCanonicalPath());
	if (platform.cygwin) {
		rv = platform.cygwin.cygpath.unix(rv);
	}
	return rv;
}

var jshPackage = function(p) {
	var invocation = [];
//	var invocation = [ getJshPathname(new File(JSH_HOME,"tools/package.jsh.js")) ];
	invocation.push("-script",getJshPathname(new File(SLIME_SRC,"jsh/test/" + p.script)));
	if (p.modules) {
		p.modules.forEach(function(module) {
			if (typeof(module) == "string") {
				invocation.push("-module", module + "=" + getJshPathname(new File(SLIME_SRC,"jsh/test/" + module)));
			} else if (module.from && module.to) {
				invocation.push("-module", module.to + "=" + getJshPathname(new File(SLIME_SRC,"jsh/test/" + module.from)));
			}
		});
	}
	if (p.files) {
		p.files.forEach(function(file) {
			if (typeof(file) == "string") {
				invocation.push("-file", file + "=" + getJshPathname(new File(SLIME_SRC,"jsh/test/" + file)));
			} else if (file.from && file.to) {
				invocation.push("-file", file.to + "=" + getJshPathname(new File(SLIME_SRC,"jsh/test/" + file.from)));
			}
		});
	}
	if (p.plugins) {
		p.plugins.forEach(function(plugin) {
			invocation.push("-plugin", getJshPathname(new File(SLIME_SRC,"jsh/test/" + plugin)));
		});
	}
	var packaged = platform.io.createTemporaryDirectory();
	packaged.mkdirs();
	var to = new File(packaged,p.script.split("/").slice(-1)[0] + ".jar");
	invocation.push("-to",getJshPathname(to));
	if (!RHINO_LIBRARIES) invocation.push("-norhino");
	jsh.shell.jsh({
		fork: true,
		script: jsh.shell.jsh.home.getFile("tools/package.jsh.js"),
		arguments: invocation
	});
//	run(LAUNCHER_COMMAND.concat(invocation));
	if (!to.getCanonicalFile().exists()) {
		throw new Error("Packaged file not created: " + to.getCanonicalFile() + " class=" + to.getClass() + " using " + LAUNCHER_COMMAND.concat(invocation).join(" "));
	}
	return to;
};

var legacy = function() {

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

var classes = platform.io.createTemporaryDirectory();
classes.mkdirs();

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

console("Compiling AddClasses to: " + classes);
platform.jdk.compile(compileOptions.concat([
	"-d", classes.getCanonicalPath(),
	"-sourcepath", [
		String(new File(SLIME_SRC,"jsh/test/addClasses/java").getCanonicalPath())
	].join(colon),
	String(new File(SLIME_SRC,"jsh/test/addClasses/java/test/AddClasses.java").getCanonicalPath())
]));

run(LAUNCHER_COMMAND.concat(
	[
		String(new File(SLIME_SRC,"jsh/test/addClasses/addClasses.jsh.js").getCanonicalPath())
		,"-classes",getJshPathname(classes)
	]
));

console("Packaging addClasses/addClasses.jsh.js");
var packagedAddClasses = jshPackage({
	script: "addClasses/addClasses.jsh.js"
});
if (!jsh.shell.environment.SKIP_PACKAGED_APPLICATIONS) {
	console("Running " + packagedAddClasses + " ...");
	runPackaged(
		packagedAddClasses.getCanonicalPath(),
		"-classes",getJshPathname(classes),
		(function() {
			var rv = {};
			for (var x in mode) {
				rv[x] = mode[x];
			}
			for (var x in mode.env) {
				rv.env[x] = mode.env[x];
			}
			delete rv.env.JSH_PLUGINS;
			return rv;
		})()
	);
}

var packaged_helper = jshPackage({
	script: "cygwin/helper.jsh.js"
});
testCommandOutput(packaged_helper, function(options) {
	checkOutput(options,[
		getJshPathname(packaged_helper)
		,getJshPathname(packaged_helper)
		,""
	])
}, { env: { JSH_PLUGINS: null } });

var packaged_plugins = jshPackage({
	script: "plugins/packaged.jsh.js",
	plugins: ["plugins/a"]
});
testCommandOutput(packaged_plugins, function(options) {
	checkOutput(options,[
		"a: Hello, World!",
		"[global] a: Hello, World!",
		""
	]);
}, {
	env: {
		JSH_PLUGINS: null
		,LOAD_JSH_PLUGIN_TEST_PLUGIN: "true"
	}
});

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

scenario.scenario("legacy", {
	create: function() {
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
	}
})

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
