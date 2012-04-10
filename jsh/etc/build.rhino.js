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

//	Build script for jsh
//
//	Execute using Rhino shell, e.g.
//	cd /path/to/jsh/source; java -jar js.jar jsh/etc/build.rhino.js <build-destination>
//
//	System properties that affect the build (environment variable name in parentheses):
//
//	jsh.build.base (JSH_BUILD_BASE): specifies directory where jsh source distribution can be found; otherwise the current working
//	directory is assumed to be the location of the source distribution
//
//	jsh.build.debug (JSH_BUILD_DEBUG): if set, additional debugging information is emitted to System.err, and the subshell that
//	generates and runs unit tests is run in the debugger
//
//	jsh.build.nounit (JSH_BUILD_NOUNIT): if set, unit tests are not run as part of the build process
//
//	jsh.build.nodoc (JSH_BUILD_NODOC): if set, no documentation is emitted as part of the build process

var File = Packages.java.io.File;
var System = Packages.java.lang.System;

var getSetting = function(systemPropertyName) {
	var environmentVariableName = systemPropertyName.replace(/\./g, "_").toUpperCase();
	if (System.getProperty(systemPropertyName)) {
		return String(System.getProperty(systemPropertyName));
	} else if (System.getenv(environmentVariableName)) {
		return String(System.getenv(environmentVariableName));
	} else {
		return null;
	}
}

var BASE = (getSetting("jsh.build.base")) ? new File(getSetting("jsh.build.base")) : new File(System.getProperty("user.dir"));
if (new File(BASE,"jsh/etc/build.rhino.js").exists() && new File(BASE,"jsh/launcher/rhino/api.rhino.js").exists()) {
	load(new File(BASE,"jsh/launcher/rhino/api.rhino.js").getCanonicalPath());
} else {
	//	TODO	A way to get around this would be to have the Rhino shell somehow make available the location from which
	//			the currently executing script was loaded, and then walk up the source tree to where the root must be
	//	TODO	Another way would be to examine the arguments given to js.jar, knowing that this script would be the first
	//			argument and it would tell us the location, but currently we cannot access this
	System.err.println("ERROR: Could not locate source code at: " + BASE.getCanonicalPath());
	System.err.println();
	System.err.println("Either execute this script from the top-level directory of the SLIME source distribution, or specify where");
	System.err.println("the source distribution can be found by setting the jsh.build.base system property. For example:");
	System.err.println();
	System.err.println("cd /path/to/slime/source; java -jar /path/to/rhino/js.jar jsh/etc/build.rhino.js");
	System.err.println();
	System.err.println("or");
	System.err.println();
	System.err.println("java -Djsh.build.base=/path/to/slime/source -jar /path/to/rhino/js.jar /path/to/slime/source/jsh/etc/build.rhino.js");
	System.exit(1);
}

if (getSetting("jsh.build.debug")) debug.on = true;

debug("java.io.tmpdir = " + System.getProperty("java.io.tmpdir"));

if (!platform.jdk.compile) {
	console("Java compiler not found (running in a JRE, rather than a JDK?)");
	console("A Java compiler is required for executing this script.");
	exit(1);
}

var JSH_HOME = function(path) {
	if (typeof(path) == "undefined") {
		console("Usage: java -jar js.jar build.rhino.js <build-destination>");
		//	TODO	Should this be interpreted as Cygwin path when on Cygwin?
		exit(1);
	}
	if (platform.cygwin) {
		path = platform.cygwin.cygpath.windows(path);
	}
	return new File(path);
}(arguments[0]);
debug("JSH_HOME = " + JSH_HOME.getCanonicalPath());
console("Building to: " + JSH_HOME.getCanonicalPath());

var remove = function(file) {
	if (!file.exists()) return;
	if (file.isDirectory()) {
		var files = file.listFiles();
		for (var i=0; i<files.length; i++) {
			remove(files[i]);
		}
	}
	file["delete"]();
}
remove(JSH_HOME);
JSH_HOME.mkdirs();

var RHINO_HOME = function() {
	//	This strategy for locating Rhino will cause problems if someone were to somehow run against something other than js.jar,
	//	like an un-jarred version
	var url = Packages.java.lang.Class.forName("org.mozilla.javascript.Context").getProtectionDomain().getCodeSource().getLocation().toString();
	var matcher = /^file\:(.*)/;
	if (matcher.exec(url)[1].substring(2,3) == ":") {
		//	this is a windows path of the form /C:/ ...
		return new File(matcher.exec(url)[1].substring(1)).getParentFile();
	} else {
		return new File(matcher.exec(url)[1]).getParentFile();
	}
}();
debug("RHINO_HOME = " + RHINO_HOME.getCanonicalPath());

var RHINO_LIBRARIES = [
	new File(RHINO_HOME,"js.jar")
	//	TODO	Used to allow XMLBeans here if env.XMLBEANS_HOME defined
];

//	TODO	Consider adding XMLBeans back in
/*
#if [ -z "$XMLBEANS_HOME" ]; then
#	echo "No XMLBEANS_HOME specified; not bundling XMLBeans."
#fi
*/

console("Creating directories ...");
["lib","script","script/launcher","modules","src"].forEach(function(path) {
	new File(JSH_HOME,path).mkdir();
});


console("Copying launcher scripts ...");
copyFile(new File(BASE,"jsh/launcher/rhino/api.rhino.js"), new File(JSH_HOME,"script/launcher/api.rhino.js"));
copyFile(new File(BASE,"jsh/launcher/rhino/jsh.rhino.js"), new File(JSH_HOME,"script/launcher/jsh.rhino.js"));

if (platform.unix) {
	copyFile(new File(BASE,"jsh/launcher/rhino/jsh.bash"), new File(JSH_HOME,"jsh.bash"));
	var path = String(new File(JSH_HOME,"jsh.bash").getCanonicalPath());
	if (platform.cygwin) {
		path = platform.cygwin.cygpath.unix(path);
	}
	var exit = runCommand("chmod","+x",path);
	if (exit) throw "Error running command: " + path;
	if (!exit) console("Created bash launcher.");
}

console("Copying libraries ...");
RHINO_LIBRARIES.forEach( function(file) {
	copyFile(file,new File(JSH_HOME,"lib/" + file.getName()));
});

if (platform.cygwin) {
	console("Building Cygwin path helper ...");
	var gccpath = platform.cygwin.realpath("/bin/g++");
	//console("real path: [" + gccpath + "]");
	var gcc = new File(platform.cygwin.cygpath.windows(gccpath));
	if (gcc.exists()) {
		new File(JSH_HOME,"bin").mkdir();
		var command = [
			String(gcc.getCanonicalPath()),
			"-o", platform.cygwin.cygpath.unix(String(new File(JSH_HOME,"bin/inonit.script.runtime.io.cygwin.cygpath.exe").getCanonicalPath())),
			platform.cygwin.cygpath.unix(String(new File(BASE,"rhino/file/java/inonit/script/runtime/io/cygwin/cygpath.cpp")))
		];
		runCommand.apply(this,command);
	} else {
		console("(build.rhino.js) Missing compiler at " + gcc.getCanonicalPath() + "; not bundling Cygwin path helper.");
	}
	//	TODO	A previous version of this build file fixed DOS line endings in the jsh.bash file when running on Cygwin bash. However,
	//			it seems possible the bash file is going away, and this can be done manually, so we leave it for now
}

var tmp = createTemporaryDirectory();

var tmpClasses = new File(tmp,"classes");
tmpClasses.mkdir();
var javaSources = [];

var addJavaFiles = function(f) {
	if (f.isDirectory() && f.getName() != ".hg") {
		var files = f.listFiles();
		for (var i=0; i<files.length; i++) {
			addJavaFiles(files[i]);
		}
	} else if (f.getName().endsWith(".java")) {
		javaSources.push(String(f.getCanonicalPath()));
	}
}

console("Building jsh application ...");
addJavaFiles(new File(BASE,"loader/rhino/java"));
addJavaFiles(new File(BASE,"rhino/system/java"));
addJavaFiles(new File(BASE,"jsh/loader/java"));
var compileOptions = ["-g", "-nowarn"]
var javacArguments = compileOptions.concat([
	"-d", tmpClasses.getCanonicalPath(),
	"-classpath", RHINO_LIBRARIES.map(function(file) { return String(file.getCanonicalPath()); }).join(colon)
]).concat(javaSources);
debug("Compiling: " + javacArguments.join(" "));
platform.jdk.compile(javacArguments);
zip(tmpClasses,new File(JSH_HOME,"lib/jsh.jar"));

console("Building launcher ...");
var tmpLauncher = new File(tmp,"launcher");
tmpLauncher.mkdir();
platform.jdk.compile(compileOptions.concat([
	"-d", tmpLauncher.getCanonicalPath(),
	"-sourcepath", [
		String(new File(BASE,"rhino/system/java").getCanonicalPath())
	].join(colon),
	String(new File(BASE,"jsh/launcher/rhino/java/inonit/script/jsh/launcher/Main.java").getCanonicalPath())
]));
var metainf = new File(tmpLauncher,"META-INF");
metainf.mkdir();
platform.io.write(new File(metainf, "MANIFEST.MF"), function(writer) {
	writer.println("Main-Class: inonit.script.jsh.launcher.Main");
});
//copyFile(new File(BASE,"jsh/launcher/rhino/java/MANIFEST.MF"), new File(metainf, "MANIFEST.MF"));
debug("Launcher compiled to: " + tmpLauncher.getCanonicalPath());
zip(tmpLauncher,new File(JSH_HOME,"jsh.jar"),[]);

console("Copying script implementations ...")
copyFile(new File(BASE,"loader"), new File(JSH_HOME,"script/platform"), [
	{
		accept: function(f) {
			return (f.isDirectory() && f.getName() == ".hg")
				|| (f.isDirectory() && f.getName() == "test")
				|| (f.isDirectory() && f.getName() == "browser")
				|| (f.isDirectory() && f.getName() == "rhino")
				|| (f.isDirectory() && f.getName() == "api")
				|| (f.getName() == "api.html")
			;
		},
		process: function(f,t) {
		}
	}
]);
copyFile(new File(BASE,"loader/rhino"), new File(JSH_HOME,"script/rhino"), [
	{
		accept: function(f) {
			return f.isDirectory() && f.getName() == "test"
				|| f.isDirectory() && f.getName() == "java"
			;
		},
		process: function(f,t) {
		}
	}
]);
copyFile(new File(BASE,"jsh/loader"), new File(JSH_HOME,"script/jsh"), [
	{
		accept: function(f) {
			return f.getName() == "api.html"
				|| f.getName() == "java"
			;
		},
		process: function(f,t) {
		}
	}
]);

console("Creating bundled modules ...")
load(new File(BASE,"jsh/tools/slime.js").getCanonicalPath());
var tmpModules = new File(tmp,"modules");
tmpModules.mkdir();
var module = function(path) {
	var tmp = new File(tmpModules,path);
	tmp.mkdirs();
	slime.build.rhino(new File(BASE,path), tmp, {
		copyFile: copyFile,
		compile: platform.jdk.compile
	}, {
		classpath: new File(RHINO_HOME, "js.jar").getCanonicalPath() + colon + new File(JSH_HOME,"lib/jsh.jar").getCanonicalPath(),
		nowarn: true
	});
	var to = new File(JSH_HOME,"modules/"+path.replace(/\//g, ".")+".slime");
	to.getParentFile().mkdirs();
	zip(tmp,to,[]);
	console("Created module file: " + to.getCanonicalPath());
};

//	TODO	loader is just to support the old platform module used by the deprecated bootstrap loader
["js/object","rhino/host","rhino/io","rhino/file","rhino/shell","jsh/shell","jsh/script","jsh/debug"].forEach( function(item) {
	module(item);
});

var LAUNCHER_COMMAND = [
	String(new File(JAVA_HOME,"bin/java").getCanonicalPath()),
	"-jar",String(new File(JSH_HOME,"jsh.jar").getCanonicalPath())
];

var jsapi_jsh = function() {
	var command = LAUNCHER_COMMAND.slice(0,LAUNCHER_COMMAND.length);
	debug("Launcher command: " + command);
	command.add = function() {
		for (var i=0; i<arguments.length; i++) {
			this.push(arguments[i]);
		}
	}
	command.add("jsh/unit/jsapi.jsh.js");
	var JSH_JSAPI_BASE = String(BASE.getCanonicalPath());
	if (platform.cygwin) {
		JSH_JSAPI_BASE = platform.cygwin.cygpath.unix(JSH_JSAPI_BASE);
	}
	if (getSetting("jsh.build.nounit")) {
		command.add("-notest");
	}
	command.add("-jsapi",JSH_JSAPI_BASE+"/"+"loader/api");

	var modules = [];
	modules.add = function(path,ns) {
		var namespace = (ns) ? ns : "";
		this.push(namespace+"@"+path+"="+JSH_JSAPI_BASE+"/"+path);
	}
	modules.add("jsh/loader/","jsh.loader");
	modules.add("loader/");
	modules.add("loader/rhino/");
	modules.add("js/object/","jsh.js");
	modules.add("rhino/host/","jsh.java");
	modules.add("rhino/io/", "jsh.io");
	modules.add("rhino/file/","jsh.file");
	modules.add("rhino/shell/");
	modules.add("jsh/shell/","jsh.shell");
	modules.add("jsh/script/","jsh.script");

	modules.forEach( function(module) {
		command.add("-module",module);
	});

	var JSAPI_DOC = String(new File(JSH_HOME,"doc/api").getCanonicalPath());
	if (platform.cygwin) {
		JSAPI_DOC = platform.cygwin.cygpath.unix(JSAPI_DOC);
	}
	if (getSetting("jsh.build.nodoc")) {
	} else {
		command.add("-doc",JSAPI_DOC);
	}

	var subenv = {};
	for (var x in env) {
		if (!/^JSH_/.test(x)) {
			subenv[x] = env[x];
		}
	}
	if (env.JSH_BUILD_DEBUG) {
		subenv.JSH_LAUNCHER_DEBUG = "true";
		subenv.JSH_SCRIPT_DEBUGGER = "rhino";
	}
	command.add({
		env: subenv
	});

	debug("jsapi.jsh.js command: " + command.join(" "));
	var status = runCommand.apply(this,command);
	if (status) {
		throw "Failed: " + command.join(" ");
	}
}

if (getSetting("jsh.build.nounit") && getSetting("jsh.build.nodoc")) {
} else {
	console("Running JSAPI ...");
	jsapi_jsh();
}

console("Creating tools ...");
var JSH_TOOLS = new File(JSH_HOME,"tools");
JSH_TOOLS.mkdir();
copyFile(new File(BASE,"jsh/tools"),JSH_TOOLS);

if (!getSetting("jsh.build.nounit")) {
	var integrationTests = function() {
		var script = new File(BASE,"jsh/test/suite.rhino.js");
		console("Running integration tests at " + script.getCanonicalPath() + " ...");
		//	Cannot use load(script.getCanonicalPath()) because errors will not propagate back to this file, so would need to roll
		//	our own inter-file communication (maybe a global variable). For now, we'll just eval the file.
		eval(readFile(script.getCanonicalPath()));
	}

	integrationTests();
}

var bases = ["js","loader","rhino","jsh"];

var JSH_SRC = new File(JSH_HOME,"src");
console("Bundling source code ...");
JSH_SRC.mkdir();
bases.forEach( function(base) {
	copyFile(new File(BASE,base), new File(JSH_SRC,base), [
		{
			accept: function(f) {
				return f.isDirectory() && f.getName() == ".hg";
			},
			process: function(f,t) {
			}
		}
	]);
});