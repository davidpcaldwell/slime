//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var mode = {};
mode.env = {};
for (var x in env) {
	if (!/^JSH_/.test(x)) {
		mode.env[x] = env[x];
	}
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

var getPath = function(basedir,relative) {
	var jfile = new File(basedir,relative);
	var rv = String(jfile.getCanonicalPath());
	if (platform.cygwin) {
		rv = platform.cygwin.cygpath.unix(rv);
	}
	return rv;
}

var tmp = createTemporaryDirectory();
run(LAUNCHER_COMMAND.concat([
	String(new File(BASE,"jsh/tools/slime.jsh.js")),
	"-from", getPath(BASE,"loader/rhino/test/data/1"),
	"-to", getPath(tmp,"1.slime")
]));

var mymode = {
	env: {}
};
for (var x in mode.env) {
	mymode.env[x] = mode.env[x];
}
mymode.env.MODULES = tmp.getCanonicalPath();
mymode.env.PATH = String(Packages.java.lang.System.getenv("PATH"));
run(LAUNCHER_COMMAND.concat(
	[
		String(new File(BASE,"jsh/test/2.jsh.js").getCanonicalPath())
	]
), mymode);

var classes = createTemporaryDirectory();
classes.mkdirs();

console("Compiling AddClasses to: " + classes);
platform.jdk.compile(compileOptions.concat([
	"-d", classes.getCanonicalPath(),
	"-sourcepath", [
		String(new File(BASE,"jsh/test/addClasses/java").getCanonicalPath())
	].join(colon),
	String(new File(BASE,"jsh/test/addClasses/java/test/AddClasses.java").getCanonicalPath())
]));

var checkOutput = function(options,messages) {
	var expected = messages.join(String(Packages.java.lang.System.getProperty("line.separator")));
	if (options.output != expected) {
		throw new Error("Output wrong: it is [" + options.output + "] when expected was [" + expected + "]");
	}
}

var testCommandOutput = function(path,tester) {
	var command = [
		String(new File(BASE,"jsh/test/" + path).getCanonicalPath())
	];
	var options = {
		output: "",
		env: mode.env
	};

	var status = runCommand.apply(this,LAUNCHER_COMMAND.concat(command).concat([options]));
	if (status != 0) throw new Error("Failed with exit status " + status);
	tester(options);
	console("");
	console("Passed: " + command.join(" "));
	console("");
};

testCommandOutput(
	"jsh.shell.echo.jsh.js",
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
	"jsh.shell-properties.jsh.js",
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

var getJshPathname = function(file) {
	var rv = String(file.getCanonicalPath());
	if (platform.cygwin) {
		rv = platform.cygwin.cygpath.unix(rv);
	}
	return rv;
}

run(LAUNCHER_COMMAND.concat(
	[
		String(new File(BASE,"jsh/test/addClasses/addClasses.jsh.js").getCanonicalPath())
		,"-classes",getJshPathname(classes)
	]
));

var jshPackage = function(p) {
	var invocation = [ getJshPathname(new File(JSH_HOME,"tools/package.jsh.js")) ];
	invocation.push("-jsh",getJshPathname(JSH_HOME));
	invocation.push("-script",getJshPathname(new File(BASE,"jsh/test/" + p.script)));
	if (p.modules) {
		p.modules.forEach(function(module) {
			if (typeof(module) == "string") {
				invocation.push("-module", module + "=" + getJshPathname(new File(BASE,"jsh/test/" + module)));
			} else if (module.from && module.to) {
				invocation.push("-module", module.to + "=" + getJshPathname(new File(BASE,"jsh/test/" + module.from)));
			}
		});
	}
	if (p.files) {
		p.files.forEach(function(file) {
			if (typeof(file) == "string") {
				invocation.push("-file", file + "=" + getJshPathname(new File(BASE,"jsh/test/" + file)));
			} else if (file.from && file.to) {
				invocation.push("-file", file.to + "=" + getJshPathname(new File(BASE,"jsh/test/" + file.from)));
			}
		});
	}
	var packaged = createTemporaryDirectory();
	packaged.mkdirs();
	var to = new File(packaged,"packaged.jsh.jar");
	invocation.push("-to",getJshPathname(to));
	run(LAUNCHER_COMMAND.concat(invocation));
	return to;
}

console("Packaging addClasses/addClasses.jsh.js");
var packagedAddClasses = jshPackage({
	script: "addClasses/addClasses.jsh.js"
});
console("Running " + packagedAddClasses + " ...");
run(LAUNCHER_COMMAND.slice(0,2).concat([
	packagedAddClasses.getCanonicalPath(),
	"-classes",getJshPathname(classes),
	mode
]));

console("Packaging packaged.jsh.js");
var packagedPackaged = jshPackage({
	script: "packaged.jsh.js",
	modules: [ "packaged/" ],
	files: ["packaged.file.js"]
});
console("Running " + packagedPackaged + " ...");
run(LAUNCHER_COMMAND.slice(0,2).concat([
	packagedPackaged.getCanonicalPath(),
	//	TODO	remove, I believe
	"-classes",getJshPathname(classes),
	mode
]));

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
run(LAUNCHER_COMMAND.slice(0,2).concat([
	packagedPackaged.getCanonicalPath(),
	mode
]));

console("Running unpackaged packaged-path.jsh.js");
testCommandOutput("packaged-path.jsh.js", function(options) {
	checkOutput(options,["Success: packaged-path.jsh.js",""]);
});