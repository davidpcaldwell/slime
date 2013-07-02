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

if (typeof(this.JSH_HOME) == "undefined") {
	if (getSystemProperty("jsh.home")) {
		JSH_HOME = new File(getSystemProperty("jsh.home"));
	} else {
		throw new Error("Could not find built shell.");
	}
}

if (typeof(this.SLIME_SRC) == "undefined") {
	if (getSystemProperty("slime.src")) {
		SLIME_SRC = new File(getSystemProperty("slime.src"));
	} else {
		throw new Error("Could not find SLIME source.");
	}
}

var LAUNCHER_COMMAND;
if (!LAUNCHER_COMMAND) {
	var vmargs = [];
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
mode.env.JSH_PLUGINS = String(new File(JSH_HOME, "plugins").getCanonicalPath());
if (debug.on) {
	mode.env.JSH_SCRIPT_DEBUGGER = "rhino";
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
				if (p.env[x]) {
					rv[x] = p.env[x];
				} else {
					delete rv[x];
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
	debug("Environment: " + env.toSource());
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
	if (status != 0) throw new Error("Failed with exit status " + status);
	tester(options);
	console("");
	console("Passed: " + command.join(" "));
	console("");
};

var checkOutput = function(options,messages) {
	var expected = messages.join(String(Packages.java.lang.System.getProperty("line.separator")));
	if (options.output != expected) {
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
	run(LAUNCHER_COMMAND.concat(invocation));
	return to;
};

(function() {
	var tmp = createTemporaryDirectory();
	run(LAUNCHER_COMMAND.concat([
		getSourceFilePath("jsh/tools/slime.jsh.js"),
		"-from", getPath(SLIME_SRC,"loader/rhino/test/data/1"),
		"-to", getPath(tmp,"1.slime")
	]));

	var mymode = {
		env: {}
	};
	for (var x in mode.env) {
		mymode.env[x] = mode.env[x];
	}
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

if (env.CATALINA_HOME) {
	console("Running httpd integration tests with CATALINA_HOME = " + env.CATALINA_HOME);
	run(LAUNCHER_COMMAND.concat(
		[
			String(new File(SLIME_SRC,"jsh/test/jsh.httpd/httpd.jsh.js").getCanonicalPath())
		]
	));
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
	checkOutput(options,[
		String(packaged_JSH_SHELL_CLASSPATH.toURI()),
		""
	]);
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
			JSH_PLUGINS: String(new File(SLIME_SRC,"jsh/test/plugins/a").getCanonicalPath())
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
	stdin: input_abcdefghij()
});

testCommandOutput("jsh.shell/stdio.3.jsh.js", function(options) {
	checkOutput(options,[
		"ABCDEFGHIJ"
	]);
}, {
	stdin: input_abcdefghij()
});

//	TODO	correct output for below in an unbuilt shell is "jsh.home=undefined"
testCommandOutput("jsh.shell/jsh.home.jsh.js", function(options) {
	checkOutput(options,[
		"jsh.home=" + JSH_HOME.getCanonicalPath() + Packages.java.io.File.separator,
		""
	])
});