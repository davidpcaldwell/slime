//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	rename this file to jsh.launcher.js

//	NOTES ABOUT UNSUPPORTED PLATFORMS
//	=================================
//
//	OLDER JAVA
//
//	To backport to 1.4 or lower, some mechanism would be needed to enumerate the environment variables. At one time this was done
//	with usr/bin/env on UNIX and was not done at all on Windows (except Cygwin; see below).
//
//	OLDER RHINO
//
//	Old versions of Rhino used Apache XMLBeans to implement E4X. If $JSH_HOME/lib/xbean.jar is present, could add it and
//	$JSH_HOME/lib/jsr173_1.0_api.jar to the "Rhino classpath" along with Rhino proper.
//
//	CYGWIN
//
//	Cygwin was once a supported platform, but it is unsupported for now. These comments pertain to the previous Cygwin
//	implementation to assist if it is resurrected.
//
//	*	Obviously many settings that are file paths need to be converted from, or to, Cygwin format, or to Cygwin format, and a
//		design would need to be developed for that purpose
//	*	Packaged applications for Cygwin may have the Cygwin paths helper at $jsh/bin/inonit.script.runtime.io.cygwin.cygpath.exe,
//		and may need to create a Cygwin library directory, copy the executable to that directory, and specify that directory to
//		the shell as some kind of property (at one time known as JSH_LIBRARY_NATIVE).
//	*	Non-packaged applications probably need to specify the equivalent of JSH_LIBRARY_NATIVE as well, to get the Cygwin paths
//		helper.
//	*	Cygwin shells probably should use Cygwin /tmp as the default temporary directory (if jsh.shell.tmpdir is not specified)
//	*	Cygwin shells probably should accept the script argument in Cygwin format
//	*	If directives continue to be supported, CLASSPATH directives should probably be accepted in Cygwin format
//	*	If Cygwin is present, should send its root directory as cygwin.root system property
//	*	If Cygwin is present and native library directory is present, send the inonit.script.runtime.io.cygwin.cygpath.exe full
//		path as cygwin.paths property. Otherwise, check to see if the Cygwin file system implementation emits a warning without the
//		cygwin.paths property; if it does not, possibly add one here.

//	NOTES ABOUT REMOVED FEATURES
//	============================
//
//	DIRECTIVES
//
//	At one time, a script could use "directives," which used lines beginning with '#' or '//#' to specify certain kinds of startup
//	configuration:
//		*	//#CLASSPATH </dir1:/dir2> added /dir1 and /dir2 to the script classpath
//		*	//#JVM_OPTION added an option to be used when starting the Java VM.
//		*	//#JDK_LIBRARY added a JDK library to the classpath (usually tools.jar).
//
//	This feature was removed for several reasons:
//		*	It was never tested with CoffeeScript and would have complicated the implementation of CoffeeScript or similar
//			preprocessors
//		*	There are easier, more robust ways to do each of these things:
//			*	For CLASSPATH, there is now jsh.loader.java.add()
//			*	For	JDK_LIBRARY, one can use a combination of jsh.shell.java.home and jsh.loader.java.add
//				TODO	better way to locate JDK libraries, perhaps with jsh.shell property
//			*	For JVM_OPTION, or others if they really need to be loaded at startup, one can simply have the script re-launch
//				itself as a subprocess using the desired configuration via jsh.shell.run, jsh.shell.java, or jsh.shell.jsh.
//
//	PATH SEARCHING
//
//	If a local, non-absolute path to a script was given, and did not resolve to a specific script relative to the working directory,
//	the shell used to search the PATH environment variable for scripts at the given relative path to execute. This feature does not
//	seem to have been useful, and scripts intended to be used as "commands" would typically be wrapped in bash scripts, which do
//	have the PATH semantics.

$api.arguments = $api.engine.resolve({
	rhino: function() {
		return $api.arguments;
	},
	nashorn: function() {
		return $arguments;
	}
})();

if (!this.$api.slime) {
	$api.script.resolve("slime.js").load();
	$api.log("Loaded slime.js: src=" + $api.slime.src);
}
$api.slime.settings.set("jsh.launcher.classpath", String(Packages.java.lang.System.getProperty("java.class.path")));
if ($api.slime.setting("jsh.launcher.debug")) {
	$api.debug.on = true;
	$api.debug("debugging enabled");
}

$api.jsh = {};
$api.jsh.engine = (function() {
	var engines = {
		rhino: {
			main: "inonit.script.jsh.Rhino",
			resolve: function(o) {
				return o.rhino;
			}
		},
		nashorn: {
			main: "inonit.script.jsh.Nashorn",
			resolve: function(o) {
				return o.nashorn;
			}
		}
	};
	if ($api.slime.settings.get("jsh.engine")) {
		return (function(setting) {
			return engines[setting];
		})($api.slime.settings.get("jsh.engine"));
	}
	return $api.engine.resolve(engines);
})();
$api.jsh.colon = String(Packages.java.io.File.pathSeparator);
$api.jsh.shell = new (function(peer) {
	$api.debug("peer = " + peer);
	$api.debug("peer.getPackaged() = " + peer.getPackaged());
	$api.debug("peer.getHome() = " + peer.getHome());
	if (peer.getPackaged()) {
		//	TODO	get rid of setProperty and just use settings
		$api.debug("Setting packaged shell: " + String(peer.getPackaged().getCanonicalPath()));
		$api.slime.settings.set("jsh.shell.packaged", String(peer.getPackaged().getCanonicalPath()));
		this.packaged = true;
	}
	if (peer.getHome()) {
		$api.slime.settings.set("jsh.shell.home", String(peer.getHome().getCanonicalPath()));
	}
	var Classpath = function(_urls) {
		this._urls = _urls;

		this.local = function() {
			var rv = [];
			for (var i=0; i<_urls.length; i++) {
				var pathname;
				if (String(_urls[i].getProtocol()) != "file") {
		//			var tmpdir = new Directory(String($api.io.tmpdir().getCanonicalPath()));
		//
		//			var rhino = ClassLoader.getSystemResourceAsStream("$jsh/rhino.jar");
		//			if (rhino) {
		//				$api.debug("Copying rhino ...");
		//				var rhinoCopiedTo = tmpdir.getFile("rhino.jar");
		//				var writeTo = rhinoCopiedTo.writeTo();
		//				$api.io.copy(rhino,writeTo);
		//			}
					throw new Error("Not a file: " + _urls[i]);
				} else {
					pathname = new Packages.java.io.File(_urls[i].toURI()).getCanonicalPath();
				}
				rv.push(pathname);
			}
			return rv;
		}
	};

	var getRhinoClasspath = function() {
		var classpath = peer.getRhinoClasspath();
		if (classpath) {
			return new Classpath(classpath);
		} else {
			return null;
		}
	};

	$api.jsh.engine.resolve({
		rhino: function() {
			(function(_urls) {
				if (_urls) {
					$api.slime.settings.set("jsh.engine.rhino.classpath", String(new Classpath(_urls).local().join($api.jsh.colon)));
				}
			})(peer.getRhinoClasspath());
		},
		nashorn: function() {
		}
	})();

	var _add = function(rv,_array) {
		for (var i=0; i<_array.length; i++) {
			rv.push(_array[i]);
		}
	};

	var Unbuilt = function(src) {
		this.shellClasspath = function() {
			var LOADER_CLASSES = $api.io.tmpdir();
			var classpath = getRhinoClasspath();
			var toCompile = $api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/java"));
			if (classpath) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/rhino")));
			toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("rhino/system/java")));
			toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/java")));
			if (classpath) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/rhino")));
			//	TODO	push colon below back into classpath object, probably
			var rhinoClasspath = (classpath) ? ["-classpath", classpath.local().join($api.jsh.colon)] : [];
			$api.java.install.compile([
				"-d", LOADER_CLASSES
			].concat(rhinoClasspath).concat(toCompile));
			return [LOADER_CLASSES.toURI().toURL()];
		}
	};

	var Built = function(home) {
		this.shellClasspath = function() {
			return [new Packages.java.io.File(home, "lib/jsh.jar").toURI().toURL()];
		}
	};

	var Packaged = function(file) {
		this.shellClasspath = function() {
			return [file.toURI().toURL()];
		}

		var ClassLoader = Packages.java.lang.ClassLoader;

		var tmpdir = $api.io.tmpdir();

		var index = 0;
		var plugin;
		$api.debug("Copying plugins ...");

		var getPlugin = function(index) {
			if (ClassLoader.getSystemResourceAsStream("$plugins/" + String(index) + ".jar")) {
				return {
					name: String(index) + ".jar",
					stream: ClassLoader.getSystemResourceAsStream("$plugins/" + String(index) + ".jar")
				};
			} else if (ClassLoader.getSystemResourceAsStream("$plugins/" + String(index) + ".slime")) {
				return {
					name: String(index) + ".slime",
					stream: ClassLoader.getSystemResourceAsStream("$plugins/" + String(index) + ".slime")
				};
			} else {
				return null;
			}
		}

		while( plugin = getPlugin(index) ) {
			var copyTo = new Packages.java.io.File(tmpdir, plugin.name);
			var writeTo = new Packages.java.io.FileOutputStream(copyTo);
			$api.io.copy(plugin.stream,writeTo);
			plugin.stream.close();
			writeTo.close();
			index++;
			$api.debug("Copied plugin " + index + " from " + plugin.name);
		}

		$api.slime.settings.set("jsh.shell.packaged.plugins", String(tmpdir.getCanonicalPath()));
	};

	var shell = (function() {
		if (peer.getPackaged()) {
			return new Packaged(peer.getPackaged());
		} else if (peer.getHome()) {
			return new Built(peer.getHome());
		} else {
			return new Unbuilt(new Packages.java.io.File($api.slime.setting("jsh.shell.src")));
		}
	})();

	this.classpath = function() {
		var rv = [];

		$api.jsh.engine.resolve({
			rhino: function() {
				_add(rv,peer.getRhinoClasspath());
			},
			nashorn: function() {
			}
		})();

		var shellClasspath = shell.shellClasspath();
		if ($api.slime.setting("jsh.shell.classpath")) {
			var specified = new Packages.java.io.File($api.slime.setting("jsh.shell.classpath")).toURI().toURL();
			if (peer.getPackaged()) {
				shellClasspath.unshift(specified);
			} else {
				shellClasspath = [specified];
			}
		};
		_add(rv,shellClasspath);

		return new Classpath(rv);
	};

	this.getRhinoClasspath = function() {
		var classpath = peer.getRhinoClasspath();
		if (classpath) {
			return new Classpath(classpath);
		} else {
			return null;
		}
	}
})(Packages.java.lang.System.getProperties().get("jsh.launcher.shell"));
$api.jsh.setExitStatus = $api.engine.resolve({
	rhino: function(status) {
		var _field = Packages.java.lang.Class.forName("org.mozilla.javascript.tools.shell.Main").getDeclaredField("exitCode");
		_field.setAccessible(true);
		if (status === null) {
			_field.set(null, new Packages.java.lang.Integer(Packages.inonit.script.jsh.launcher.Engine.Rhino.NULL_EXIT_STATUS));
		} else {
			_field.set(null, new Packages.java.lang.Integer(status));
		}
	},
	nashorn: function(status) {
		if (status !== null) {
			Packages.java.lang.System.exit(status);
		}
	}
});
$api.jsh.vmArguments = (function() {
	//	TODO	what about jsh.jvm.options? If it is set, the options may already have been applied by launcher and we may not need
	//			to add them and fork a VM; launcher could *unset* them, perhaps. Need to think through and develop test case
	if ($api.jsh.shell.packaged) return [];
	var rv = [];
	while($api.arguments.length && $api.arguments[0].substring(0,1) == "-") {
		rv.push($api.arguments.shift());
	}
	return rv;
})();

if ($api.arguments.length == 0 && !$api.jsh.shell.packaged) {
	$api.console("Usage: " + $api.script.file + " <script-path> [arguments]");
	//	TODO	should replace the below with a mechanism that uses setExitStatus, adding setExitStatus for Rhino throwing a
	//			java.lang.Error so that it is not caught
	Packages.java.lang.System.exit(1);
}

$api.debug("Launcher environment = " + JSON.stringify($api.shell.environment, void(0), "    "));
$api.debug("Launcher working directory = " + Packages.java.lang.System.getProperty("user.dir"));
$api.debug("Launcher system properties = " + Packages.java.lang.System.getProperties());

try {
	//	TODO	Prefer the client VM unless -server is specified (and do not redundantly specify -client)
	//	TODO	At one point, was investigating using jjs as Nashorn launcher; is this still a good idea? If so, would using the
	//			Rhino shell as main make sense for the Rhino case?
		//	Rhino
		//	TODO	implement profiler; see below ... probably needs to move to main script
//		} else if (env.JSH_SCRIPT_DEBUGGER == "profiler" || /^profiler\:/.test(env.JSH_SCRIPT_DEBUGGER)) {
//			//	TODO	there will be a profiler: version of this variable that probably allows passing a filter to profile only
//			//			certain classes and/or scripts; this should be parsed here and the filter option passed through to the agent
//			//	from settings:
//			//	this.profiler = JSH_HOME.getFile("tools/profiler.jar");
//			if (settings.get("profiler") && JSH_SHELL_CONTAINER == "jvm") {
//				var withParameters = /^profiler\:(.*)/.exec(env.JSH_SCRIPT_DEBUGGER);
//				if (withParameters) {
//					command.add("-javaagent:" + settings.get("profiler").path + "=" + withParameters[1]);
//				} else {
//					command.add("-javaagent:" + settings.get("profiler").path);
//				}
//			} else {
//				//	TODO	allow explicit setting of profiler agent location when not running in ordinary built shell
//				//	emit warning message?
//			}
//		}
	$api.debug("Creating command ...");
	var command = new $api.java.Command();

	var container = (function() {
		//	TODO	test whether next line necessary
		if ($api.jsh.shell.packaged) return "jvm";
		if ($api.slime.settings.get("jsh.shell.container")) return $api.slime.settings.get("jsh.shell.container");
		return "classloader";
	})();
	if (container == "jvm") {
		command.fork();
	}

	for (var i=0; i<$api.jsh.vmArguments.length; i++) {
		command.vm($api.jsh.vmArguments[i]);
	}

	$api.slime.settings.sendPropertiesTo(function(name,value) {
		command.systemProperty(name,value);
	});

	var classpath = $api.jsh.shell.classpath().local();
	for (var i=0; i<classpath.length; i++) {
		command.classpath(classpath[i]);
	}

	command.main($api.jsh.engine.main);

	for (var i=0; i<$api.arguments.length; i++) {
		command.argument($api.arguments[i]);
	}

	$api.debug("Running command " + command + " ...");
	var status = command.run();
	$api.debug("Command returned: status = " + status);
	$api.jsh.setExitStatus(status);
} catch (e) {
	$api.debug("Error:");
	$api.debug(e);
	$api.debug(e.fileName + ":" + e.lineNumber);
	if (e.rhinoException) {
		e.rhinoException.printStackTrace();
	} else if (e.printStackTrace) {
		e.printStackTrace();
	} else if (typeof(e) == "string") {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e);
	} else if (e instanceof Error) {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e.message);
	}
	//	Below works around Rhino debugger bug that does not allow e to be inspected
	var error = e;
	debugger;
	$api.jsh.setExitStatus(1);
}