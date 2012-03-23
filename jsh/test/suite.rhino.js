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

var run = function(command) {
	console(command.join(" "));
	var status = runCommand.apply(this,command);
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

run(LAUNCHER_COMMAND.concat(
	[
		String(new File(BASE,"jsh/test/2.jsh.js").getCanonicalPath())
		, { env: { MODULES: tmp.getCanonicalPath() }}
	]
));

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

(function() {
	var command = [
		String(new File(BASE,"jsh/test/jsh.shell.echo.jsh.js").getCanonicalPath())
	];
	var options = {
		output: ""
	};

	var status = runCommand.apply(this,LAUNCHER_COMMAND.concat(command).concat([options]));
	if (status != 0) throw new Error("Failed with exit status " + status);
	var messages = [
		"true",
		""
	];
	if (options.output != messages.join(String(Packages.java.lang.System.getProperty("line.separator")))) throw new Error("Output wrong: it is [" + options.output + "]");
	console("");
	console("Passed: " + command.join(" "));
	console("");
})();

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

var jshPackage = function() {
	var invocation = [ getJshPathname(new File(JSH_HOME,"tools/package.jsh.js")) ];
	invocation.push("-jsh",getJshPathname(JSH_HOME));
	invocation.push("-script",getJshPathname(new File(BASE,"jsh/test/addClasses/addClasses.jsh.js")));
	var packaged = createTemporaryDirectory();
	packaged.mkdirs();
	var to = new File(packaged,"addClasses.jsh.jar");
	invocation.push("-to",getJshPathname(to));
	run(LAUNCHER_COMMAND.concat(invocation));
	return to;
}

console("Packaging addClasses/addClasses.jsh.js");
var packagedAddClasses = jshPackage();
console("Running " + packagedAddClasses + " ...");
var mode = {};
mode.env = {};
for (var x in env) {
	if (!/^JSH_/.test(x)) {
		mode.env[x] = env[x];
	}
}
run(LAUNCHER_COMMAND.slice(0,2).concat([
	packagedAddClasses.getCanonicalPath(),
	"-classes",getJshPathname(classes),
	mode
]));