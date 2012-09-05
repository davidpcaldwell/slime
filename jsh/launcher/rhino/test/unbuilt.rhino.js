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

debug.on = true;
//	TODO	could we get our own location using a stack trace and make this unnecessary?
debug("Source: " + String(env.JSH_SLIME_SRC));
var JSH_SLIME_SRC = new (function() {
	var _base;

	if (platform.cygwin) {
		_base = new Packages.java.io.File(platform.cygwin.cygpath.windows(String(env.JSH_SLIME_SRC)));
	} else {
		_base = new Packages.java.io.File(String(env.JSH_SLIME_SRC));
	}

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
//var JSH_SLIME_SRC =

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

//	TODO	duplicates logic in jsh/etc/build.rhino.js, but with very different strategy
//	apparently we do not have to have Rhino in the classpath here because it is in the system classpath
var LOADER_CLASSES = createTemporaryDirectory();
platform.jdk.compile([
	"-d", LOADER_CLASSES,
	"-sourcepath", [
		JSH_SLIME_SRC.getPath("loader/rhino/java"),
		JSH_SLIME_SRC.getPath("rhino/system/java"),
		JSH_SLIME_SRC.getPath("jsh/loader/java")
	].join(colon)
]
	.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("loader/rhino")))
	.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("rhino/system")))
	.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("jsh/loader")))
);

var MODULE_CLASSES = createTemporaryDirectory();
var _file = new Packages.java.io.File(Packages.java.lang.System.getProperty("user.dir"));
//	TODO	this list of modules is duplicated in jsh/etc/build.rhino.js
var modules = ["js/object","rhino/host","rhino/io","rhino/file","rhino/shell","jsh/shell","jsh/script","jsh/debug","rhino/http/client"];
//	TODO	some of this logic is duplicated in jsh/tools/slime.js
var RHINO_JAR = (function() {
	//	TODO	brutally plagiarized from jsh/etc/build.rhino.js
	var File = Packages.java.io.File;
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
	return new File(RHINO_HOME, "js.jar").getCanonicalPath();
})();
modules.forEach(function(path) {
	var files = addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile(path));

	if (files.length > 0) {
		platform.jdk.compile([
			"-d", MODULE_CLASSES,
			//	LOADER_CLASSES not currently necessary
			"-classpath", [RHINO_JAR, LAUNCHER_CLASSES].join(colon),
		].concat(files));
	}
});

//	TODO	Obviously under Cygwin shell does not include the paths helper

runCommand(
	Packages.java.lang.System.getProperty("java.home") + "/bin/java",
	"-classpath", LAUNCHER_CLASSES,
	"inonit.script.jsh.launcher.Main",
	arguments[0],
	{
		env: new (function() {
			for (var x in env) {
				if (/^JSH_/.test(x)) {
				} else {
					this[x] = env[x];
				}
			}
			this.JSH_RHINO_CLASSPATH = RHINO_JAR;
			this.JSH_RHINO_SCRIPT = JSH_SLIME_SRC.getPath("jsh/launcher/rhino/jsh.rhino.js");
			this.JSH_SHELL_CLASSPATH = LOADER_CLASSES;
			this.JSH_SCRIPT_CLASSPATH = MODULE_CLASSES;
			this.JSH_LIBRARY_SCRIPTS_LOADER = JSH_SLIME_SRC.getPath("loader");
			this.JSH_LIBRARY_SCRIPTS_RHINO = JSH_SLIME_SRC.getPath("loader/rhino");
			this.JSH_LIBRARY_SCRIPTS_JSH = JSH_SLIME_SRC.getPath("jsh/loader");
			this.JSH_LIBRARY_MODULES = JSH_SLIME_SRC.getPath(".");
		})()
	}
);