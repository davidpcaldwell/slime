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
	"-d", LOADER_CLASSES
]
	.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("loader/rhino")))
	.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("rhino/system")))
	.concat(addJavaSourceFilesFrom(JSH_SLIME_SRC.getFile("jsh/loader")))
);

var MODULE_CLASSES = createTemporaryDirectory();
var _file = new Packages.java.io.File(Packages.java.lang.System.getProperty("user.dir"));
//	TODO	this list of modules is duplicated in jsh/etc/build.rhino.js
var modules = ["js/object","js/document","js/mime","js/debug","rhino/host","rhino/io","rhino/file","rhino/shell",/*"jsh/shell",*/"jsh/script","rhino/http/client","rhino/mail"];
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

var args = [];
args.push(
	Packages.java.lang.System.getProperty("java.home") + "/bin/java",
	"-classpath", LAUNCHER_CLASSES,
	"inonit.script.jsh.launcher.Main"
);
args = args.concat(arguments);
args.push(
	{
		env: new (function() {
			for (var x in env) {
				if (x == "JSH_SCRIPT_DEBUGGER" || x == "JSH_PLUGINS" || x == "JSH_LAUNCHER_DEBUG" || "JSH_JVM_OPTIONS") {
					this[x] = env[x];
				} else if (/^JSH_/.test(x)) {
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
		//	Cannot be enabled at this time; see issue 152
		,input: Packages.java.lang.System["in"]
	}
);

//	TODO	much of this is redundant with inonit.system.Command, but we preserve it here because we are trying to remain
//			dependent only on Rhino, which apparently has a bug(?) making its own runCommand() not work correctly in this
//			scenario when an InputStream is provided: even when underlying process terminates, command does not return
//	TODO	this has the potential to run really slowly when written in JavaScript
var runCommand = function() {
	var context = new function() {
		var mode;

		this.setMode = function(value) {
			mode = value;
		}

		this.environment = function(_environment) {
			if (mode.env) {
				_environment.clear();
				for (var x in mode.env) {
					if (mode.env[x]) {
						_environment.put(new Packages.java.lang.String(x), new Packages.java.lang.String(mode.env[x]));
					}
				}
			} else {
			}
		}

		this.getStandardOutput = function() {
			if (mode && mode.output) return mode.output;
			return Packages.java.lang.System.out;
		};
		this.getStandardError = function() {
			if (mode && mode.err) return mode.err;
			return Packages.java.lang.System.err;
		};
		this.getStandardInput = function() {
			if (mode && mode.input) return mode.input;
			return new JavaAdapter(
				Packages.java.io.InputStream,
				new function() {
					this.read = function() {
						return -1;
					}
				}
			);
		};
	}
	var list = new Packages.java.util.ArrayList();
	for (var i=0; i<arguments.length; i++) {
		if (typeof(arguments[i]) == "string") {
			list.add(new Packages.java.lang.String(arguments[i]));
		} else if (i < arguments.length-1) {
			list.add(new Packages.java.lang.String(String(arguments[i])));
		} else {
			//	TODO	in Rhino-compatible runCommand this should only work if it is the last argument
			context.setMode(arguments[i]);
		}
	}
	var _builder = new Packages.java.lang.ProcessBuilder(list);
	context.environment(_builder.environment());
	var Spooler = function(_in,_out,closeOnEnd) {
		var flush = closeOnEnd;
		this.run = function() {
			var i;
			try {
				while( (i = _in.read()) != -1 ) {
					_out.write(i);
					//	TODO	This flush, which essentially turns off buffering, is necessary for at least some classes of
					//			applications that are waiting on input in order to decide how to proceed.
					if (flush) {
						_out.flush();
					}
				}
				if (closeOnEnd) {
					_out.close();
				}
			} catch (e) {
				this._e = e;
			}
		}
	};
	Spooler.start = function(_in,_out,closeOnEnd,name) {
		var s = new Spooler(_in, _out, closeOnEnd);
		var t = new Packages.java.lang.Thread(
			new JavaAdapter(
				Packages.java.lang.Runnable,
				s
			)
		);
		t.setName(t.getName() + ":" + name);
		t.start();
		return t;
	};
	var spoolName = Array.prototype.join.call(arguments, ",");
	var delegate = _builder.start();
	var _in = Spooler.start(delegate.getInputStream(), context.getStandardOutput(), false, "stdout: " + spoolName);
	var _err = Spooler.start(delegate.getErrorStream(), context.getStandardError(), false, "stderr: " + spoolName);
	var _stdin = context.getStandardInput();
	var _out = Spooler.start(_stdin, delegate.getOutputStream(), true, "stdin from " + _stdin + ": " + spoolName);
	var rv = delegate.waitFor();
	_in.join();
	_err.join();
	return rv;
};

exit(runCommand.apply(null, args));
