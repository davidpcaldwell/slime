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

//	This script wraps commands to be executed directly from a SLIME source distribution
//
//	It places the following variables in the scope:
//	slime: TODO document

//	Arguments passed via jrunscript
//if (Packages.java.lang.System.getProperties().get("jsh.unbuilt.arguments")) {
//	arguments = Packages.java.lang.System.getProperties().get("jsh.unbuilt.arguments");
//}
//
//if (!arguments.splice) {
//	//	Nashorn in 8u40 apparently made arguments a Java array
//	arguments = (function(were) {
//		var rv = [];
//		for (var i=0; i<were.length; i++) {
//			rv[i] = were[i];
//		}
//		return rv;
//	})(arguments);
//}
//
//var load = (function(before) {
//	return function(path) {
//		before.call(this,String(path));
//	}
//})(load);
//
//var slime = new function() {
//	var SLIME_SRC = (function() {
//		var SLIME_SRC;
//
//		if (Packages.java.lang.System.getProperties().get("jsh.unbuilt.src")) {
//			SLIME_SRC = Packages.java.lang.System.getProperties().get("jsh.unbuilt.src");
//		};
//	//	if (new File(SLIME_SRC,"jsh/etc/build.rhino.js").exists() && new File(SLIME_SRC,"jsh/launcher/rhino/api.rhino.js").exists()) {
//	//	SLIME_SRC = (getSetting("jsh.build.base")) ? new File(getSetting("jsh.build.base")) : new File(System.getProperty("user.dir"));
//
//		if (!SLIME_SRC) SLIME_SRC = (function() {
//			var thisfile;
//			if (typeof(Packages.org.mozilla.javascript.WrappedException) == "function") {
//				//	TODO	could this fail under certain kinds of optimization?
//				var frames;
//				try {
//					throw new Packages.org.mozilla.javascript.WrappedException(Packages.java.lang.RuntimeException());
//				} catch (e) {
//		//			debugger;
//					var error = e;
//					frames = error.getScriptStack();
//				}
//				//	Packages.java.lang.System.err.println("stack trace length: " + frames.length);
//				for (var i=0; i<frames.length; i++) {
//					//	Packages.java.lang.System.err.println("stack trace: " + frames[i].fileName);
//					thisfile = String(frames[i].fileName);
//				}
//			} else {
//				thisfile = new Packages.java.lang.Throwable().getStackTrace()[0].getFileName();
//			}
//			if (thisfile && /unbuilt\.rhino\.js/.test(thisfile)) {
//				return new Packages.java.io.File(thisfile).getCanonicalFile().getParentFile().getParentFile().getParentFile();
//			}
//			//	TODO	below is included defensively in case some optimizations cause the above to fail
//			//	TODO	probably would not work for Cygwin; see below logic from earlier version
//		//	if (platform.cygwin) {
//		//		_base = new Packages.java.io.File(platform.cygwin.cygpath.windows(String(env.JSH_SLIME_SRC)));
//		//	} else {
//		//		_base = new Packages.java.io.File(String(env.JSH_SLIME_SRC));
//		//	}
//			if (Packages.java.lang.System.getenv("SLIME_SRC")) return new Packages.java.io.File(Packages.java.lang.System.getenv("SLIME_SRC"));
//			Packages.java.lang.System.err.println("Could not determine SLIME source location. Probable solutions:");
//			Packages.java.lang.System.err.println("* Run Rhino in interpreted mode (try -opt -1 on the command line)");
//			Packages.java.lang.System.err.println("* Define the SLIME_SRC environment variable to point to the SLIME source directory.");
//			Packages.java.lang.System.exit(1);
//		})();
//		//	TODO	A way to get around this would be to have the Rhino shell somehow make available the location from which
//		//			the currently executing script was loaded, and then walk up the source tree to where the root must be; this can
//		//			apparently be done in CommonJS mode
//		//	TODO	Another way would be to examine the arguments given to js.jar, knowing that this script would be the first
//		//			argument and it would tell us the location, but currently we cannot access this
//	//	System.err.println("ERROR: Could not locate source code at: " + SLIME_SRC.getCanonicalPath());
//	//	System.err.println();
//	//	System.err.println("Either execute this script from the top-level directory of the SLIME source distribution, or specify where");
//	//	System.err.println("the source distribution can be found by setting the jsh.build.base system property. For example:");
//	//	System.err.println();
//	//	System.err.println("cd /path/to/slime/source; java -jar /path/to/rhino/js.jar jsh/etc/build.rhino.js");
//	//	System.err.println();
//	//	System.err.println("or");
//	//	System.err.println();
//	//	System.err.println("java -Djsh.build.base=/path/to/slime/source -jar /path/to/rhino/js.jar /path/to/slime/source/jsh/etc/build.rhino.js");
//	//	System.exit(1);
//
//		Packages.java.lang.System.out.println("SLIME_SRC = " + SLIME_SRC.getCanonicalPath());
//		return SLIME_SRC;
//	})();
//
//	load(new Packages.java.io.File(SLIME_SRC,"jsh/etc/api.rhino.js"));
//
//	this.src = new (function() {
//		var _base = SLIME_SRC;
//
//		this.toString = function() {
//			return String(SLIME_SRC.getCanonicalPath().toString());
//		};
//
//		var getFile = function(path) {
//			return new Packages.java.io.File(_base, path);
//		};
//
//		var getPath = function(path) {
//			return String(getFile(path).getCanonicalPath());
//		};
//
//		this.getFile = function(path) {
//			return getFile(path);
//		};
//
//		this.getPath = function(path) {
//			return getPath(path);
//		};
//
//		this.getSourceFilesUnder = function getSourceFilesUnder(dir,rv) {
//			if (typeof(rv) == "undefined") {
//				rv = [];
//			}
//			var files = dir.listFiles();
//			if (!files) return [];
//			for (var i=0; i<files.length; i++) {
//				if (files[i].isDirectory() && String(files[i].getName()) != ".hg") {
//					getSourceFilesUnder(files[i],rv);
//				} else {
//					if (files[i].getName().endsWith(".java")) {
//						rv.push(files[i]);
//					}
//				}
//			}
//			return rv;
//		}
//	})();
//
//	this.launcher = {
//		compile: function(LAUNCHER_CLASSES) {
//			platform.jdk.compile([
//				"-d", LAUNCHER_CLASSES,
//				"-sourcepath", slime.src.getPath("rhino/system/java") + Packages.java.io.File.pathSeparator + slime.src.getPath("jsh/launcher/rhino/java"),
//				slime.src.getPath("jsh/launcher/rhino/java/inonit/script/jsh/launcher/Main.java")
//			]);
//		}
//	}
//}

$api.script.resolve("api.jrunscript.js").load();

Packages.java.lang.System.err.println("arguments=" + $api.arguments);
if ($api.arguments[0] == "build") {
	$api.arguments.splice(0,1);
	$api.script.resolve("build.rhino.js").load();
//	load(slime.src.getFile("jsh/etc/build.rhino.js"));
} else if ($api.arguments[0] == "launch") {
	$api.arguments.splice(0,1);
//	load(slime.src.getFile("jsh/launcher/rhino/test/unbuilt.rhino.js"));
	$api.script.resolve("../../jsh/launcher/rhino/test/unbuilt.rhino.js").load();
} else if (arguments[0] == "jdwp" || arguments[0] == "xjdwp") {
	var AGENTLIB_JDWP = (arguments[0] == "jdwp") ? arguments[1] : void(0);
	arguments.splice(0,2);
	load(slime.src.getFile("jsh/launcher/rhino/test/unbuilt.rhino.js"));
} else if (arguments[0] == "develop") {
	arguments.splice(0,1,String(slime.src.getFile("jsh/etc/develop.jsh.js")));
	load(slime.src.getFile("jsh/launcher/rhino/test/unbuilt.rhino.js"));
} else if ($api.arguments[0] == "verify") {
	var verifyArgs = $api.arguments.slice(1);
	var buildArgs = [];
	$api.arguments.splice(0,$api.arguments.length);
	for (var i=0; i<verifyArgs.length; i++) {
		if (verifyArgs[i] == "-native") {
			buildArgs.push("-native");
			verifyArgs.splice(i,1);
			i--;
		} else {
		}
	}
	var JSH_HOME = $api.io.tmpdir({ prefix: "jsh-verify.", suffix: ".tmp" });
	JSH_HOME.mkdirs();
	$api.arguments.push(JSH_HOME);
	$api.arguments.push.apply($api.arguments,buildArgs);
	Packages.java.lang.System.setProperty("jsh.build.notest","true");
	Packages.java.lang.System.setProperty("jsh.build.nodoc","true");
	//	TODO	set jsh.build.rhino to a java.io.File if it is needed here so that build builds it
	$api.arguments.push("-install","coffeescript","-install","tomcat")
	$api.script.resolve("../../jsh/etc/build.rhino.js").load();
	var command = [];
	command.push(String($api.java.launcher),"-jar",String(new File(JSH_HOME,"jsh.jar")));
	command.push(String(slime.src.getFile("jsh/test/verify.jsh.js")),"-slime",slime.src.toString());
	command = command.concat(verifyArgs);
	if (Packages.java.lang.System.getProperty("jsh.build.tomcat.home")) {
		command.push("-tomcat",String(new Packages.java.io.File(Packages.java.lang.System.getProperty("jsh.build.tomcat.home"))));
	}
	Packages.java.lang.System.err.println("Verifying with command: " + command.join(" "));
	var status = $api.engine.runCommand.apply(this,command);
	if (status) {
		throw new Error("Verification failed with status: " + status);
	}
} else if (arguments[0] == "test") {
	arguments.splice(0,1);
	//	create temporary file
	var JSH_HOME = Packages.java.io.File.createTempFile("jsh-unbuilt.", ".tmp");
	JSH_HOME.mkdirs();
	arguments.push(JSH_HOME.getCanonicalPath());
	Packages.java.lang.System.setProperty("jsh.build.nounit", "true");
	load(slime.src.getFile("jsh/etc/build.rhino.js"));
} else {
	Packages.java.lang.System.err.println("Usage:");
	Packages.java.lang.System.err.println("unbuilt.rhino.js build <arguments>");
	Packages.java.lang.System.err.println("unbuilt.rhino.js launch <arguments>");
	Packages.java.lang.System.exit(1);
}

if (false) {
	Packages.java.lang.System.out.println("arguments = " + arguments);
}