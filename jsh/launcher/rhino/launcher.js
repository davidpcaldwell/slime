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

if (!this.$api.slime) {
	$api.script.resolve("slime.js").load();
	$api.log("Loaded slime.js: src=" + $api.slime.src);
}

var env = $api.shell.environment;
var debug = $api.debug;
var platform = new function() {
};
var colon = String(Packages.java.io.File.pathSeparator);

$api.jsh = {};
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
$api.jsh.arguments = $api.engine.resolve({
	rhino: function(a) {
		return a;
	},
	nashorn: function() {
		return $arguments;
	}
})(arguments);

if ($api.jsh.arguments.length == 0 && !Packages.java.lang.System.getProperty("jsh.launcher.packaged")) {
	$api.console("Usage: " + $api.script.file + " <script-path> [arguments]");
	//	TODO	should replace the below with a mechanism that uses setExitStatus, adding setExitStatus for Rhino throwing a
	//			java.lang.Error so that it is not caught
	Packages.java.lang.System.exit(1);
}

var File = function(path) {
	this.toString = function() {
		return path;
	}

	this.path = path;

	this.writeTo = function() {
		return new Packages.java.io.FileOutputStream(new Packages.java.io.File(path));
	}
}

var Directory = function(path) {
	var peer = new Packages.java.io.File(path);

	this.path = String(peer.getCanonicalPath());

	this.getCommand = function(relative) {
		var getWithSuffix = function(name,suffix) {
			if (new Packages.java.io.File(peer,name + suffix).exists()) {
				return new File(String(new Packages.java.io.File(peer,name + suffix).getCanonicalPath()))
			}
			return null;
		}

		//	TODO	should use more complex logic than this but it works for the java and jjs cases
		if (env.PATHEXT) {
			if (getWithSuffix(relative,".exe")) {
				return getWithSuffix(relative,".exe");
			}
		}
		return getWithSuffix(relative,"");
	}

	this.getFile = function(relative) {
		var file = new Packages.java.io.File(peer,relative);
		return new File( String(file.getCanonicalPath()) );
	}

	this.getDirectory = function(relative) {
		return new Directory(String(new Packages.java.io.File(peer,relative).getCanonicalPath()));
	}
}

var Searchpath = function(p) {
	var elements = [];

	this.toString = function() {
		return elements.toString();
	}

	if (typeof(p) == "string") {
		elements = p.split(colon);
	} else if (typeof(p) == "undefined") {
		//	empty path
	} else if (typeof(p) == "object" && p instanceof Array) {
		p.forEach( function(item) {
			var element = (item.path) ? item.path : item;
			elements.push(element);
		});
	}

	this.elements = elements;

	this.append = function(searchpath) {
		return new Searchpath(elements.concat(searchpath.elements));
	}

	this.toPath = function() {
		return elements.join(colon);
	}

	this.ClassLoader = function() {
		var _urls = new $api.java.Array({ type: Packages.java.net.URL, length: elements.length });
		for (var i=0; i<elements.length; i++) {
			_urls[i] = new Packages.java.io.File(elements[i]).toURI().toURL();
			debug("classpath: " + elements[i]);
		}
		var _classloader = new Packages.java.net.URLClassLoader(_urls);
		return _classloader;
	}
}
$api.slime.setting.Searchpath = function(name) {
	return new Searchpath($api.slime.setting(name));
}

var getProperty = function(name) {
	var rv = Packages.java.lang.System.getProperty(name);
	if (rv) return String(rv);
	return null;
}

var os = function(pathname,path) {
	if (platform.cygwin) {
		var mode = {
			path: path
		}
		return platform.cygwin.cygpath.windows(pathname,mode)
	}
	return pathname;
}

var UNDEFINED = function(){}();

if ($api.slime.setting("jsh.launcher.debug")) {
	$api.debug.on = true;
	$api.debug("debugging enabled");
}

$api.debug("Launcher environment = " + JSON.stringify($api.shell.environment, void(0), "    "));
$api.debug("Launcher working directory = " + getProperty("user.dir"));
$api.debug("Launcher system properties = " + Packages.java.lang.System.getProperties());

//	TODO	Probably gives JRE, rather than JDK; what do we need this for, anyway?
var JAVA_HOME = new Directory( getProperty("java.home") );

var settings = {
	use: [],
	get: function(id) {
		var rv;
		for (var i=0; i<this.use.length; i++) {
			if (typeof(this.use[i][id]) != "undefined") {
				rv = this.use[i][id];
			}
		}
		return rv;
	}
};

settings.defaults = new function() {
	if (platform.cygwin) {
		this.JSH_TMPDIR = new Directory(os("/tmp"));
	}
	if (platform.unix) {
		//	TODO	allow this to be overridden by environment variable
		this.JSH_OS_ENV_UNIX = os("/usr/bin/env");
	}

	//	The jsh.launcher.rhino.classpath property was already processed by the launcher to be in OS-format, because it was used to
	//	create the classloader inside which we are executing
	debug("jsh.launcher.rhino = " + getProperty("jsh.launcher.rhino"));
	debug("jsh.launcher.rhino.classpath = " + getProperty("jsh.launcher.rhino.classpath"));
	this.rhinoClasspath =
		(getProperty("jsh.launcher.rhino.classpath"))
		? new Searchpath(getProperty("jsh.launcher.rhino.classpath"))
		: new Searchpath(getProperty("java.class.path"))
	;

	this.JSH_PLUGINS = new Searchpath(new Directory(getProperty("user.home")).getDirectory(".jsh/plugins").path);
};
settings.use.push(settings.defaults);

debug("jsh.launcher.packaged = " + getProperty("jsh.launcher.packaged"));
if (getProperty("jsh.launcher.packaged") != null) {
	settings.packaged = new function() {
		this.packaged = true;

		var ClassLoader = Packages.java.lang.ClassLoader;

		this.__defineGetter__("source", function() {
			return $api.engine.readUrl( ClassLoader.getSystemResource("main.jsh.js") );
		});

		var tmpdir = new Directory(String($api.io.tmpdir().getCanonicalPath()));

		var rhino = ClassLoader.getSystemResourceAsStream("$jsh/rhino.jar");
		if (rhino) {
			debug("Copying rhino ...");
			var rhinoCopiedTo = tmpdir.getFile("rhino.jar");
			var writeTo = rhinoCopiedTo.writeTo();
			$api.io.copy(rhino,writeTo);
			rhino.close();
			writeTo.close();
		}

		var index = 0;
		var plugin;
		var plugins = [];
		debug("Copying plugins ...");

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
			var copyTo = tmpdir.getFile(plugin.name);
			var writeTo = copyTo.writeTo();
			$api.io.copy(plugin.stream,writeTo);
			plugin.stream.close();
			writeTo.close();
			plugins.push(copyTo);
			index++;
			debug("Copied plugin " + index + " from " + plugin.name);
		}

		this.rhinoClasspath = (rhinoCopiedTo) ? new Searchpath([ rhinoCopiedTo ]) : new Searchpath([]);
		this.shellClasspath = new Searchpath(getProperty("java.class.path"));
		this.scriptClasspath = [];
		this.JSH_PLUGINS = new Searchpath(plugins);

		var cygwin = ClassLoader.getSystemResourceAsStream("$jsh/bin/inonit.script.runtime.io.cygwin.cygpath.exe");
		if (cygwin != null && platform.cygwin) {
			debug("Copying Cygwin paths helper ...");
			var cygwinTo = tmpdir.getFile("inonit.script.runtime.io.cygwin.cygpath.exe").writeTo();
			$api.io.copy(cygwin,cygwinTo);
			cygwin.close();
			cygwinTo.close();
			debug("Copied Cygwin paths helper to " + tmpdir);
			this.JSH_LIBRARY_NATIVE = tmpdir;
		}
	}
} else if (getProperty("jsh.home")) {
	settings.built = new function() {
		var JSH_HOME = new Directory( getProperty("jsh.home") );
		debug("JSH_HOME = " + JSH_HOME.path);

		this.shellClasspath = new Searchpath([JSH_HOME.getFile("lib/jsh.jar").path]);
		this.scriptClasspath = [];

		if (platform.cygwin) {
			this.JSH_LIBRARY_NATIVE = JSH_HOME.getDirectory("bin");
		}

		this.JSH_PLUGINS = new Searchpath([
			JSH_HOME.getDirectory("plugins"),
			new Directory(getProperty("user.home")).getDirectory(".jsh/plugins")
		]);

		this.profiler = JSH_HOME.getFile("tools/profiler.jar");
	}
} else if ($api.slime.setting("jsh.slime.src")) {
	settings.unbuilt = new function() {
		var SLIME_SRC = new Directory( $api.slime.setting("jsh.slime.src") );

		var getShellClasspath = function() {
			debugger;
			if (!arguments.callee.cached) {
				if ($api.slime.setting("jsh.slime.src")) {
					//	TODO	this may work, because of the existing slime variable, but it may not, or may by coincidence, because
					//			it is not well-thought-out.
					var LOADER_CLASSES = $api.io.tmpdir();
					var RHINO_JAR = settings.get("rhinoClasspath");
					var _cl = new RHINO_JAR.ClassLoader();
					try {
						_cl.loadClass("org.mozilla.javascript.Context");
					} catch (e) {
						RHINO_JAR = null;
					}
					var toCompile = $api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/java"));
					if (RHINO_JAR) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/rhino")));
					toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("rhino/system/java")));
					toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/java")));
					if (RHINO_JAR) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/rhino")));
					var rhinoClasspath = (RHINO_JAR) ? ["-classpath", RHINO_JAR] : [];
					$api.java.install.compile([
						"-d", LOADER_CLASSES
					].concat(rhinoClasspath).concat(toCompile));
					arguments.callee.cached = new Searchpath(String(LOADER_CLASSES.getCanonicalPath()));
				}
			}
			return arguments.callee.cached;
		}
		var shellClasspath = getShellClasspath();
		if (shellClasspath) {
			this.shellClasspath = shellClasspath;
		}
		this.scriptClasspath = [];
		if (platform.cygwin) {
			this.JSH_LIBRARY_NATIVE = JSH_HOME.getDirectory("bin");
		}

//		this.JSH_PLUGINS = new Searchpath([
//			JSH_HOME.getDirectory("plugins"),
//			new Directory(getProperty("user.home")).getDirectory(".jsh/plugins")
//		]);

//		this.profiler = JSH_HOME.getFile("tools/profiler.jar");
	}
}

if (settings.packaged) {
	debug("Using packaged jsh.");
	settings.use.push(settings.packaged);
} else if (settings.built) {
	settings.use.push(settings.built);
} else if (settings.unbuilt) {
	settings.use.push(settings.unbuilt);
}

settings.explicit = new function() {
	if ($api.slime.setting("jsh.shell.classpath")) {
		var specified = $api.slime.setting.Searchpath("jsh.shell.classpath");
		this.shellClasspath = (settings.packaged) ? specified.append(settings.packaged.shellClasspath) : specified;
	};

	var self = this;
	[
		"JSH_LIBRARY_NATIVE",
		"JSH_TMPDIR"
	].forEach( function(name) {
		self[name] = (env[name]) ? new Directory(os(env[name])) : UNDEFINED;
	});

	[
		"JSH_PLUGINS"
	].forEach( function(name) {
		self[name] = (typeof(env[name]) != "undefined") ? new Searchpath(os(env[name],true)).toPath() : UNDEFINED;
	});

	if ($api.slime.setting("jsh.plugins")) {
		self.JSH_PLUGINS = new Searchpath($api.slime.setting("jsh.plugins"));
	}

	["JSH_RHINO_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER"].forEach(function(name) {
		this[name] = env[name];
	}, this);

	["JSH_JAVA_LOGGING_PROPERTIES"].forEach(function(name) {
		this[name] = (typeof(env[name]) != "undefined") ? new File(os(env[name])) : UNDEFINED;
	}, this);

	if (!settings.packaged) {
		var httpUrlPattern = /^http(?:s?)\:\/\/(.*)/;
		if (httpUrlPattern.test($api.jsh.arguments[0])) {
			debugger;
			this.script = $api.jsh.arguments[0];

			this.source = $api.engine.readUrl($api.jsh.arguments[0]);
		} else {
			this.script = (function(path) {
//				TODO	move this documentation somewhere more relevant
//
//				We are attempting to support the following usages:
//				#!/path/to/bash /path/to/jsh/jsh.bash
//				/path/to/specific/jsh/jsh.bash /path/to/script
//				/path/to/specific/jsh/jsh.bash /path/to/softlink
//				#!/path/to/jsh
//
//				Need to document this:
//				Development version of jsh which runs directly out of the source tree
//
//				Also:
//				#!/path/to/jsh.bash - works when executed from Cygwin bash shell, does not work on FreeBSD, apparently does not work on
//					Fedora
//				/path/to/specific/jsh.bash command - looks up command in PATH, works on Cygwin and FreeBSD, but emits warning message
//					that usage is unsupported.  See comment below.

				//	Find the file to be executed
				if (platform.cygwin) {
					path = platform.cygwin.cygpath.windows(path);
				}
				if (new Packages.java.io.File(path).exists()) {
					return new File( String(new Packages.java.io.File(path).getCanonicalPath()) );
				}
				var slash = Packages.java.io.File.separator;
				if (path.indexOf(slash) == -1) {
					debug("PATH = " + env.PATH);
					var search = env.PATH.split(colon);
					for (var i=0; i<search.length; i++) {
						if (new Packages.java.io.File(search[i] + slash + arguments[0]).exists()) {
							return new File(String(new Packages.java.io.File(search[i] + slash + path).getCanonicalPath()));
						}
					}
					$api.console("Not found in PATH: " + path);
					Packages.java.lang.System.exit(1);
				} else {
					debug("Working directory: PWD=" + env.PWD);
					$api.console("Script not found: " + path)
					Packages.java.lang.System.exit(1);
				}
			})($api.jsh.arguments[0]);

			this.source = $api.engine.readFile(this.script.path);
		}
	}

	this.jvmOptions = [];

	if (env.JSH_JVM_OPTIONS) {
		env.JSH_JVM_OPTIONS.split(" ").forEach( function(option) {
			self.jvmOptions.push(option);
		});
	}
}

//	TODO	allow directive to declare plugin?
settings.directives = function(source) {
	var directivePattern = /^(?:\/\/)?\#(.*)$/;
	var directives = source.split("\n").map( function(line) {
		if (line.substring(0,line.length-1) == "\r") {
			return line.substring(0,line.length-1);
		} else {
			return line;
		}
	}).filter( function(line) {
		return directivePattern.test(line);
	}).map( function(line) {
		return directivePattern.exec(line)[1];
	});
	directives.jvmOptions = [];
	directives.classpath = [];
	directives.jdkLibraries = [];
	debug("DIRECTIVES:\n" + directives.join("\n"));
	directives.forEach( function(item) {
		var match;

		if (item.substring(0,1) == "!") {
			//	is #! directive; do nothing
		} else if (match = /^JVM_OPTION\s+(.*)/.exec(item)) {
			directives.jvmOptions.push(match[1]);
		} else if (match = /^CLASSPATH\s+(.*)/.exec(item)) {
			var pathElement = match[1];
			if (platform.cygwin) {
				pathElement = platform.cygwin.cygpath.windows(match[1]);
			}
			if (!settings.packaged) {
				directives.classpath.push(new File(pathElement));
			} else {
				$api.console("Warning: ignoring #CLASSPATH directive in packaged script: " + match[1]);
			}
		} else if (match = /^JDK_LIBRARY\s+(.*)/.exec(item)) {
			directives.jdkLibraries.push(JAVA_HOME.getFile(match[1]));
		} else {
			//	unrecognized directive
		}
	} );
	this.jvmOptions = directives.jvmOptions;
	this.scriptClasspath = directives.classpath.concat(directives.jdkLibraries);
}

//	TODO	probably need more thought into which explicit preferences should really apply to packaged applications
//			classpaths are a candidate for things that should not apply
settings.use.push(settings.explicit);

settings.use.push(new settings.directives(settings.get("source")));
settings.combine = function(id) {
	var rv = [];
	for (var i=0; i<this.use.length; i++) {
		if (typeof(this.use[i][id]) != "undefined") {
			rv = rv.concat(this.use[i][id]);
		}
	}
	return rv;
}

try {

	//	TODO	Could contemplate including XMLBeans in rhinoClasspath if found:
	//
	//	if [ -z $JSH_RHINO_CLASSPATH ]; then
	//		JSH_RHINO_CLASSPATH=$JSH_HOME/lib/js.jar
	//		if [ -f $JSH_HOME/lib/xbean.jar ]; then
	//			#	Include XMLBeans
	//			JSH_RHINO_CLASSPATH=$JSH_RHINO_CLASSPATH:$JSH_HOME/lib/xbean.jar:$JSH_HOME/lib/jsr173_1.0_api.jar
	//		fi
	//	fi
	debug("Creating command ...");
	var command = new $api.java.Command();
//	var JSH_SHELL_CONTAINER = (env.JSH_SHELL_CONTAINER) ? env.JSH_SHELL_CONTAINER : "classloader";
//	var command = new Command();
	var container = ($api.slime.settings.get("jsh.shell.container")) ? $api.slime.settings.get("jsh.shell.container") : "classloader";
	if (container == "classloader" && !settings.packaged && (true || !env.JSH_SHELL_CLASSPATH)) {
//		command.configure("classloader");
	} else {
		command.fork();
//		command.configure("jvm");
	}
	debugger;
	if (settings.get("script")) {
		while($api.arguments.length && $api.arguments[0].substring(0,1) == "-") {
			command.vm($api.arguments.shift());
		}
	}
//	var jvmOptions = settings.combine("jvmOptions");

	var environmentAndProperties = function() {
		$api.slime.settings.sendPropertiesTo(function(name,value) {
			command.systemProperty(name,value);
		});
//		[
//			"JSH_RHINO_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER"
////			,"JSH_LIBRARY_SCRIPTS_LOADER", "JSH_LIBRARY_SCRIPTS_JSH"
////			,"JSH_LIBRARY_MODULES"
//			,"JSH_PLUGINS"
//			,"JSH_OS_ENV_UNIX"
//		].forEach(function(name) {
//			var property = name.toLowerCase().split("_").join(".");
//			command.jvmProperty(property,settings.get(name));
//		});

//		if (settings.get("JSH_TMPDIR")) {
//			command.jvmProperty("java.io.tmpdir",settings.get("JSH_TMPDIR").path);
//		}
//
//		if (settings.get("JSH_JAVA_LOGGING_PROPERTIES")) {
//			command.jvmProperty("java.util.logging.config.file",settings.get("JSH_JAVA_LOGGING_PROPERTIES").path);
//		}

//		if (platform.cygwin) {
//			command.jvmProperty("cygwin.root",platform.cygwin.cygpath.windows("/"));
//			//	TODO	check for existence of the executable?
//			if (!settings.get("JSH_LIBRARY_NATIVE")) {
//				$api.console("WARNING: could not locate Cygwin paths helper; could not find Cygwin native library path.");
//				$api.console("Use JSH_LIBRARY_NATIVE to specify location of Cygwin native libraries.");
//			} else {
//				command.jvmProperty("cygwin.paths",settings.get("JSH_LIBRARY_NATIVE").getFile("inonit.script.runtime.io.cygwin.cygpath.exe").path);
//			}
//		}

//		[
//			"jsh.home", "jsh.slime.src"
//		].forEach(function(property) {
//			if ($api.slime.setting(property)) {
//				command.jvmProperty(property, $api.slime.setting(property));
//			}
//		});

//		[
//			"jsh.launcher.packaged", "jsh.launcher.classpath", "jsh.launcher.rhino", "jsh.launcher.rhino.classpath", "jsh.launcher.rhino.script"
//		].forEach( function(property) {
//			if (getProperty(property)) {
//				command.jvmProperty(property, getProperty(property));
//			}
//		} );
//		for (var x in env) {
//			if (x.substring(0,4) == "JSH_" || x == "PATH") {
//				command.jvmProperty("jsh.launcher.environment." + x, env[x]);
//			}
//		}
	}

	var shellClasspath = settings.get("shellClasspath");
	debugger;
	if (!shellClasspath) {
		$api.console("Could not find jsh shell classpath: JSH_SHELL_CLASSPATH not defined.");
		Packages.java.lang.System.exit(1);
	}

	var scriptClasspath = new Searchpath(settings.combine("scriptClasspath"));

	//	Prefer the client VM unless -server is specified (and do not redundantly specify -client)
	if (Packages.java.lang.System.getProperty("jsh.launcher.nashorn")) {
		//	Nashorn
//		var JJS = false;
//		if (JJS) {
//			command.executable(JAVA_HOME.getDirectory("bin").getCommand("jjs"));
//		} else {
//			command.executable(JAVA_HOME.getDirectory("bin").getCommand("java"));
//		}
		//	TODO	handle JSH_JAVA_DEBUGGER, probably by detecting open port and using that port for dt_socket and server=y
		//	TODO	handle JSH_SCRIPT_DEBUGGER == "profiler"
		//	TODO	decide about client-vs.-server VM, probably not needed
//		if (jvmOptions.length) {
//			command.add(jvmOptions.map(function(option) {
//				if (JJS) {
//					return "-J" + option;
//				} else {
//					return option;
//				}
//			}));
//		}
		environmentAndProperties();
		var classpath = shellClasspath.append(scriptClasspath);
		for (var i=0; i<classpath.elements.length; i++) {
			command.classpath(classpath.elements[i]);
		}
//		command.classpath(shellClasspath.append(scriptClasspath));
//		if (JJS) {
//			command.add(settings.get("JSH_LIBRARY_SCRIPTS_JSH").getFile("nashorn-host.js").path);
//			command.add(settings.get("JSH_LIBRARY_SCRIPTS_JSH").getFile("jsh.js").path);
//			command.add("--");
//		} else {
//			command.mainClassName("inonit.script.jsh.Nashorn");
//		}
		command.main("inonit.script.jsh.Nashorn");
	} else {
		//	Rhino
//		command.executable(JAVA_HOME.getDirectory("bin").getCommand("java"));
//		if (env.JSH_JAVA_DEBUGGER) {
//			//	TODO	this option seems to have changed as of Java 5 or Java 6 to agentlib or agentpath
//			//			see http://docs.oracle.com/javase/6/docs/technotes/guides/jpda/conninv.html
//			command.add("-Xrunjdwp:transport=dt_shmem,server=y");
//		} else if (env.JSH_SCRIPT_DEBUGGER == "profiler" || /^profiler\:/.test(env.JSH_SCRIPT_DEBUGGER)) {
//			//	TODO	there will be a profiler: version of this variable that probably allows passing a filter to profile only
//			//			certain classes and/or scripts; this should be parsed here and the filter option passed through to the agent
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
//		if (JSH_SHELL_CONTAINER == "jvm") {
//			if (jvmOptions.indexOf("-server") == -1 && jvmOptions.indexOf("-client") == "-1") {
//				jvmOptions.unshift("-client");
//			}
//			command.add(jvmOptions);
//		} else {
//			if (jvmOptions.length) {
//				throw new Error("JVM options specified when using internal launcher: " + jvmOptions.join(" "));
//			}
//		}
		environmentAndProperties();
//		command.add("-classpath");
//		command.classpath(
//			settings.get("rhinoClasspath")
//			.append(shellClasspath)
//			.append(scriptClasspath)
//		);
		command.classpath(settings.get("rhinoClasspath"));
		for (var i=0; i<shellClasspath.elements.length; i++) {
			command.classpath(shellClasspath.elements[i]);
		}
//		command.classpath(shellClasspath);
		command.classpath(scriptClasspath);
		debug("rhinoClasspath = " + settings.get("rhinoClasspath"));
		debug("shellClasspath = " + shellClasspath);
		debug("scriptClasspath = " + scriptClasspath);
//		command.mainClassName("inonit.script.jsh.Rhino");
		command.main("inonit.script.jsh.Rhino");
	}
//	command.script(settings.get("script"));
	command.systemProperty("jsh.plugins", settings.get("JSH_PLUGINS").toPath());
	if (settings.get("script")) {
		command.argument(settings.get("script"));
	} else {
		command.systemProperty("jsh.launcher.packaged", getProperty("jsh.launcher.packaged"));
	}
	var index = (settings.get("script")) ? 1 : 0;
	debug("Skipping: " + index + " arguments");
	//	TODO	below obviously broken for internal launcher
	for (var i=index; i<$api.jsh.arguments.length; i++) {
		command.argument($api.jsh.arguments[i]);
	}
//	debug("Command:");
//	debug(command.line());
	debugger;
//	var mode = {
//		input: Packages.java.lang.System["in"],
//		output: Packages.java.lang.System["out"],
//		err: Packages.java.lang.System["err"]
//	};
	var mode = null;
	debug("Running command " + command + " ...");
	var status = command.run(mode);
	$api.jsh.setExitStatus(status);
	debug("Command returned.");
} catch (e) {
	debug("Error:");
	debug(e);
	//	Below works around Rhino debugger bug that does not allow e to be inspected
	debug(e.fileName + ":" + e.lineNumber);
	if (e.rhinoException) {
		e.rhinoException.printStackTrace();
	} else if (e.printStackTrace) {
		e.printStackTrace();
	} else if (typeof(e) == "string") {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e);
	} else if (e instanceof Error) {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e.message);
	}
	var error = e;
	debugger;
	$api.jsh.setExitStatus(1);
} finally {
	//	TODO	the below may be dead code; remove it if it is
//	if (typeof(setExitStatus.value) != "undefined") {
//		exit(setExitStatus.value);
//	}
}