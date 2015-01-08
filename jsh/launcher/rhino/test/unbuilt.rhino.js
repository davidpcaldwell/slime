//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	Script to launch a script in an unbuilt jsh. Should be invoked via the jsh/etc/unbuilt.rhino.js tool; see that tool for
//	details

var SLIME_SRC;
if (typeof(SLIME_SRC) == "undefined") {
	Packages.java.lang.System.err.println("This script should be invoked from the jsh/etc/unbuilt.rhino.js script; see that"
		+ " script for details."
	);
	Packages.java.lang.System.exit(1);
}
var _base = SLIME_SRC;

debug.on = true;
debug("Source: " + String(_base.getCanonicalPath()));
var JSH_SLIME_SRC = new (function() {
	var getFile = function(path) {
		return new Packages.java.io.File(_base, path);
	}

	var getPath = function(path) {
		return String(getFile(path).getCanonicalPath());
	}

	this.getFile = function(path) {
		return getFile(path);
	}

	this.getPath = function(path) {
		return getPath(path);
	}
})();

//	Build the launcher classes
var LAUNCHER_CLASSES = createTemporaryDirectory();
//	TODO	duplicated almost exactly in jsh/etc/build.rhino.js
platform.jdk.compile([
	"-d", LAUNCHER_CLASSES,
	"-sourcepath", JSH_SLIME_SRC.getPath("rhino/system/java"),
	JSH_SLIME_SRC.getPath("jsh/launcher/rhino/java/inonit/script/jsh/launcher/Main.java")
]);

var addJavaSourceFilesFrom = function(dir,rv) {
	if (typeof(rv) == "undefined") {
		rv = [];
	}
	var files = dir.listFiles();
	if (!files) return [];
	for (var i=0; i<files.length; i++) {
		if (files[i].isDirectory()) {
			addJavaSourceFilesFrom(files[i],rv);
		} else {
			if (files[i].getName().endsWith(".java")) {
				rv.push(files[i]);
			}
		}
	}
	return rv;
}

var RHINO_JAR = (function() {
	//	TODO	brutally plagiarized from jsh/etc/build.rhino.js
	var File = Packages.java.io.File;
	var rhinoContextClass = (function() {
		try {
			return Packages.java.lang.Class.forName("org.mozilla.javascript.Context")
		} catch (e) {
			return null;
		}
	})();
	if (!rhinoContextClass) {
		return null;
	}
	var RHINO_PATH = function() {
		//	This strategy for locating Rhino will cause problems if someone were to somehow run against something other than js.jar,
		//	like an un-jarred version
		var url = Packages.java.lang.Class.forName("org.mozilla.javascript.Context").getProtectionDomain().getCodeSource().getLocation().toString();
		var matcher = /^file\:(.*)/;
		if (matcher.exec(url)[1].substring(2,3) == ":") {
			//	this is a windows path of the form /C:/ ...
			return matcher.exec(url)[1].substring(1);
		} else {
			return matcher.exec(url)[1];
		}
	}();
	debug("RHINO_PATH = " + RHINO_PATH);
	return new File(RHINO_PATH).getCanonicalPath();
})();
//	TODO	duplicates logic in jsh/etc/build.rhino.js, but with very different strategy
//	apparently we do not have to have Rhino in the classpath here because it is in the system classpath
var LOADER_CLASSES = createTemporaryDirectory();
var toCompile = addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("loader/rhino/java"));
if (RHINO_JAR) toCompile = toCompile.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("loader/rhino/rhino")));
toCompile = toCompile.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("rhino/system/java")));
toCompile = toCompile.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("jsh/loader/java")));
if (RHINO_JAR) toCompile = toCompile.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("jsh/loader/rhino")));

platform.jdk.compile([
	"-d", LOADER_CLASSES
].concat(toCompile));

var MODULE_CLASSES = createTemporaryDirectory();
var _file = new Packages.java.io.File(Packages.java.lang.System.getProperty("user.dir"));
//	TODO	this list of modules is duplicated in jsh/etc/build.rhino.js
var modules = (function() {
	var code = eval(readFile(JSH_SLIME_SRC.getFile("jsh/etc/api.js")));
	return code.environment("jsh").filter(function(module) {
		return module.module;
	});
})();
console("Found " + modules.length + " modules.");
//	TODO	some of this logic is duplicated in jsh/tools/slime.js
var MODULE_CLASSPATH = [];
if (RHINO_JAR) MODULE_CLASSPATH.push(RHINO_JAR);
MODULE_CLASSPATH.push(LAUNCHER_CLASSES);
modules.forEach(function(module) {
	var path = module.path;
	if (module.module && module.module.javac) {
		console("Compiling: " + path);
		var files = addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile(path + "/java"));
		if (!files) throw new Error("Files null for " + path);
		if (RHINO_JAR) files = files.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile(path + "/rhino")));

		if (files.length > 0) {
			platform.jdk.compile([
				"-d", MODULE_CLASSES,
				//	LOADER_CLASSES not currently necessary
				"-classpath", MODULE_CLASSPATH.join(colon),
			].concat(files));
		}
	} else {
		console("No Java compile needed: " + path + " " + JSON.stringify(module));
	}
});

//	TODO	Obviously under Cygwin shell does not include the paths helper

var args = [];
args.push(Packages.java.lang.System.getProperty("java.home") + "/bin/java");
//	TODO	if JSH_SHELL_CONTAINER is jvm, debugger will not be run anywhere
if (AGENTLIB_JDWP && env.JSH_SHELL_CONTAINER != "jvm") {
	args.push("-agentlib:jdwp=" + AGENTLIB_JDWP);
}
if (env.JSH_SHELL_CONTAINER != "jvm" && env.JSH_JAVA_LOGGING_PROPERTIES) {
	args.push("-Djava.util.logging.config.file=" + env.JSH_JAVA_LOGGING_PROPERTIES)
}
args.push(
	"-classpath", LAUNCHER_CLASSES,
	"inonit.script.jsh.launcher.Main"
);
args = args.concat(arguments);
args.push(
	{
		env: new (function() {
			var passthrough = ["JSH_SCRIPT_DEBUGGER","JSH_PLUGINS","JSH_LAUNCHER_DEBUG","JSH_JVM_OPTIONS","JSH_ENGINE","JSH_JAVA_LOGGING_PROPERTIES","JSH_RHINO_OPTIMIZATION","JSH_SHELL_CONTAINER"];
			for (var x in env) {
				if (passthrough.indexOf(x) != -1) {
					this[x] = env[x];
				} else if (/^JSH_/.test(x)) {
				} else {
					this[x] = env[x];
				}
			}
			if (RHINO_JAR) this.JSH_RHINO_CLASSPATH = RHINO_JAR;
			this.JSH_RHINO_SCRIPT = JSH_SLIME_SRC.getPath("jsh/launcher/rhino/jsh.rhino.js");
			this.JSH_SHELL_CLASSPATH = LOADER_CLASSES;
			this.JSH_SCRIPT_CLASSPATH = MODULE_CLASSES;
			this.JSH_LIBRARY_SCRIPTS_LOADER = JSH_SLIME_SRC.getPath("loader");
			this.JSH_LIBRARY_SCRIPTS_RHINO = JSH_SLIME_SRC.getPath("loader/rhino");
			this.JSH_LIBRARY_SCRIPTS_JSH = JSH_SLIME_SRC.getPath("jsh/loader");
			this.JSH_LIBRARY_MODULES = JSH_SLIME_SRC.getPath(".");
		})()
		//	Cannot be enabled at this time; see issue 152
		,input: Packages.java.lang.System["in"]
	}
);

Packages.java.lang.System.err.println("Running: " + args.join(" "));
Packages.java.lang.System.exit(runCommand.apply(null, args));
