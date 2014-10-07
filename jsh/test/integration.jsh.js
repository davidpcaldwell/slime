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

//	Required in scope:
//	jsh/launcher/rhino/api.rhino.js must be run in global scope
//
//	(optional, can use environment variable) JSH_HOME: Packages.java.io.File representing home of built shell
//	(optional, can use environment variable) SLIME_SRC: Packages.java.io.File representing source directory
//	(optional) LAUNCHER_COMMAND: the command to use when launching a shell
//	(optional) compileOptions: array of string to use when compiling Java code

var parameters = jsh.script.getopts({
	options: {
		src: jsh.script.file.getRelativePath("../..")
	}
});

var src = parameters.options.src.directory;

var RHINO_LIBRARIES = (jsh.shell.jsh.home.getFile("lib/js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function") ? [jsh.shell.jsh.home.getRelativePath("lib/js.jar").java.adapt()] : null;

eval(src.getFile("jsh/launcher/rhino/api.rhino.js").read(String));

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

var PACKAGED_LAUNCHER = (function() {
	var command = [];
	command.push(getPath(JAVA_HOME,"bin/java"));
	command.push("-jar");
	return command;
})();

var runPackaged = function() {
	var command = PACKAGED_LAUNCHER.slice(0);
	for (var i=0; i<arguments.length; i++) {
		command.push(arguments[i]);
	}
	run(command);
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
	console(command.join(" "));
	var status = runCommand.apply(this,command.concat(mymode));
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
	var invocation = [ getJshPathname(new File(JSH_HOME,"tools/package.jsh.js")) ];
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
	var packaged = createTemporaryDirectory();
	packaged.mkdirs();
	var to = new File(packaged,p.script.split("/").slice(-1)[0] + ".jar");
	invocation.push("-to",getJshPathname(to));
	if (!RHINO_LIBRARIES) invocation.push("-norhino");
	run(LAUNCHER_COMMAND.concat(invocation));
	if (!to.getCanonicalFile().exists()) {
		throw new Error("Packaged file not created: " + to.getCanonicalFile() + " class=" + to.getClass() + " using " + LAUNCHER_COMMAND.concat(invocation).join(" "));
	}
	return to;
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
	var tmp = createTemporaryDirectory();
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

var classes = createTemporaryDirectory();
classes.mkdirs();

var CATALINA_HOME = (function() {
	if (env.JSH_BUILD_TOMCAT_HOME) return env.JSH_BUILD_TOMCAT_HOME;
	if (env.CATALINA_HOME) return env.CATALINA_HOME;
	if (jsh.shell.jsh.home.getSubdirectory("lib/tomcat")) return jsh.shell.jsh.home.getSubdirectory("lib/tomcat").pathname.toString()
})();
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
	mymode.env.CATALINA_HOME = CATALINA_HOME;
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

console("Packaging packaged.jsh.js");
var packagedPackaged = jshPackage({
	script: "packaged.jsh.js",
	modules: [ "packaged/" ],
	files: ["packaged.file.js"]
});
console("Running " + packagedPackaged + " ...");
runPackaged(
	packagedPackaged.getCanonicalPath(),
	//	TODO	remove, I believe
	"-classes",getJshPathname(classes),
	mode
);

console("Running unpackaged packaged.jsh.js");
testCommandOutput("packaged.jsh.js", function(options) {
	checkOutput(options,["Loaded both.", ""]);
});

console("Packaging packaged-path.jsh.js");
var packagedPackaged2 = jshPackage({
	script: "packaged-path.jsh.js",
	modules: [ { from: "packaged-path/path/", to: "path" } ],
	files: [ { from: "packaged-path/file.js", to: "file.js" }]
});
console("Running " + packagedPackaged2 + " ...");
testCommandOutput(packagedPackaged2, function(options) {
	checkOutput(options,["Success: packaged-path.jsh.js.jar",""]);
});

console("Running unpackaged packaged-path.jsh.js");
testCommandOutput("packaged-path.jsh.js", function(options) {
	checkOutput(options,["Success: packaged-path.jsh.js",""]);
});

var packaged_JSH_SHELL_CLASSPATH = jshPackage({
	script: "JSH_SHELL_CLASSPATH.jsh.js"
});

console("Running JSH_SHELL_CLASSPATH package ... ")
testCommandOutput(packaged_JSH_SHELL_CLASSPATH, function(options) {
	var outputUri = options.output.split(String(Packages.java.lang.System.getProperty("line.separator")))[0];
	var _outputFile = new Packages.java.io.File(new Packages.java.net.URI(outputUri));
	if (String(_outputFile.getCanonicalPath()) == String(packaged_JSH_SHELL_CLASSPATH.getCanonicalPath())) {
		Packages.java.lang.System.err.println("Same URI: " + outputUri + " and " + packaged_JSH_SHELL_CLASSPATH.toURI());
	} else {
		Packages.java.lang.System.err.println("Output wrong; dumping stderr:");
		Packages.java.lang.System.err.println(options.err);
		Packages.java.lang.System.err.println("Output file: " + _outputFile + " canonical: " + _outputFile.getCanonicalPath());
		Packages.java.lang.System.err.println("Correct file: " + packaged_JSH_SHELL_CLASSPATH);
		throw new Error("Output wrong; different URI: it is [" + options.output + "] when expected was [" + packaged_JSH_SHELL_CLASSPATH.toURI() + "]");
	}
//	checkOutput(options,[
//		String(packaged_JSH_SHELL_CLASSPATH.toURI()),
//		""
//	]);
});

//	Test was disabled as failing, attempting to re-enable to fix issue 79
if (true) {
	var environment = {
		JSH_SHELL_CLASSPATH: String(new File(JSH_HOME,"lib/jsh.jar").getCanonicalPath())
	};
	console("Running JSH_SHELL_CLASSPATH package with " + environment.toSource() + " ...");
	testCommandOutput(packaged_JSH_SHELL_CLASSPATH, function(options) {
		checkOutput(options,[
			String(new File(JSH_HOME,"lib/jsh.jar").getCanonicalFile().toURI()),
			""
		]);
	}, {
		env: environment
	});
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
});

testCommandOutput("$api-deprecate-properties.jsh.js", function(options) {
	checkOutput(options,[
		"o.f.property = foo", ""
	]);
});

(function() {
	testCommandOutput("plugins/packaged.jsh.js", function(options) {
		checkOutput(options,[
			"a: Hello, World!",
			"[global] a: Hello, World!",
			""
		]);
	}, {
		env: {
			JSH_PLUGINS: String(new File(SLIME_SRC,"jsh/test/plugins/a").getCanonicalPath()),
			LOAD_JSH_PLUGIN_TEST_PLUGIN: "true"
		}
	})
})();

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

testCommandOutput(
	"jsh.shell/echo.jsh.js",
	function(options) {
		var messages = [
			"true",
			""
		];
		if (options.output != messages.join(String(Packages.java.lang.System.getProperty("line.separator")))) {
			throw new Error("Output wrong: it is [" + options.output + "]");
		}
	}
);

testCommandOutput(
	"jsh.shell/properties.jsh.js",
	function(options) {
		var messages = [
			"Passed.",
			""
		];
		if (options.output != messages.join(String(Packages.java.lang.System.getProperty("line.separator")))) {
			throw new Error("Output wrong: it is [" + options.output + "]");
		}
	}
);

testCommandOutput("jsh.shell/stdio.1.jsh.js", function(options) {
	return options.output == "Hello, World!" && options.err == "Hello, tty!";
});

var input_abcdefghij = function() {
	var b = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, 10);
	for (var i=0; i<b.length; i++) {
		b[i] = i+65;
	}
	return new Packages.java.io.ByteArrayInputStream(b);
};

testCommandOutput("jsh.shell/stdio.2.jsh.js", function(options) {
	checkOutput(options,[
		"ABCDEFGHIJ"
	]);
}, {
	stdin: input_abcdefghij(),
	env: {
		JSH_PLUGINS: ""
	}
});

testCommandOutput("jsh.shell/stdio.3.jsh.js", function(options) {
	checkOutput(options,[
		"ABCDEFGHIJ"
	]);
}, {
	stdin: input_abcdefghij(),
	env: {
		JSH_PLUGINS: ""
	}
});

//	TODO	correct output for below in an unbuilt shell is "jsh.home=undefined"
testCommandOutput("jsh.shell/jsh.home.jsh.js", function(options) {
	checkOutput(options,[
		"jsh.home=" + JSH_HOME.getCanonicalPath() + Packages.java.io.File.separator,
		""
	])
});

testCommandOutput("jsh.script/Application.jsh.js", function(options) {
	var json = JSON.parse(options.output);
	if (json.global.gstring != "gvalue") throw new Error(options.output);
	if (json.global.gboolean !== true) throw new Error(options.output);
	if (json.options.lboolean !== true) throw new Error(options.output);
	if (json.options.lstring !== "foo") throw new Error(options.output);
}, {
	arguments: ["-gstring", "gvalue", "-gboolean", "doIt", "-lboolean"]
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
	arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("loader/issue32.jsh.js")),
	stdio: {
		output: String
	},
	evaluate: function(result) {
		if (result.status == 0) {
			var globals = eval("(" + result.stdio.output + ")");
			if (globals.length > 1) {
				throw new Error("Too many globals: " + globals);
			} else if (globals.length == 1 && globals[0] != "jsh") {
				throw new Error("Wrong global variable name: " + globals[0]);
			} else {
				jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
				jsh.shell.echo();
			}
		} else {
			throw new Error("Status: " + result.status);
		}
	}
});

if (RHINO_LIBRARIES) {
	jsh.shell.echo("Testing Rhino optimization ...");
	(function(level) {
		jsh.shell.run({
			command: LAUNCHER_COMMAND[0],
			arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("rhino-optimization.jsh.js")),
			stdio: {
				output: String
			},
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				JSH_RHINO_OPTIMIZATION: String(level)
			}),
			evaluate: function(result) {
				var optimization = Number(result.stdio.output);
				if (result.status == 0 && optimization == level) {
					jsh.shell.echo("Passed: " + result.command + " " + result.arguments.join(" "));
					jsh.shell.echo();
				} else {
					throw new Error("Status: " + result.status);
				}
			}
		});
	})(1);
}

if (CATALINA_HOME) {
	jsh.shell.run({
		command: LAUNCHER_COMMAND[0],
		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("jsh.script/http.jsh.js")),
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

if (COFFEESCRIPT) {
	jsh.shell.run({
		command: LAUNCHER_COMMAND[0],
		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("coffee/hello.jsh.coffee")),
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
	jsh.shell.run({
		command: LAUNCHER_COMMAND[0],
		arguments: LAUNCHER_COMMAND.slice(1).concat(jsh.script.file.getRelativePath("coffee/loader.jsh.js")),
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
if (nativeLauncher) {
	jsh.shell.run({
		command: nativeLauncher,
		arguments: [jsh.script.file.getRelativePath("jsh.shell/echo.jsh.js")],
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
		arguments: [jsh.script.file.getRelativePath("jsh.shell/echo.jsh.js")],
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
		arguments: [jsh.script.file.getRelativePath("jsh.shell/echo.jsh.js")],
		stdio: {
			output: String
		},
		evaluate: function(result) {
			if (result.error) {
				jsh.shell.echo("error: " + result.error);
				jsh.shell.echo("error keys: " + Object.keys(result.error));
			}
			jsh.shell.echo("keys: " + Object.keys(result));
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
}

jsh.shell.echo("Integration tests complete.");