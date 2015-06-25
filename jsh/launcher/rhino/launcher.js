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

Packages.java.lang.System.setProperty("jsh.launcher.classpath", Packages.java.lang.System.getProperty("java.class.path"));

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

$api.jsh = {};
$api.jsh.engine = {
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
}[String(Packages.java.lang.System.getProperty("jsh.launcher.engine"))];
$api.jsh.colon = String(Packages.java.io.File.pathSeparator);
$api.jsh.shell = new (function(peer) {
	if (peer.getPackaged()) {
		Packages.java.lang.System.setProperty("jsh.launcher.packaged", peer.getPackaged().getCanonicalPath());
		this.packaged = true;
	}
	if (peer.getHome()) {
		Packages.java.lang.System.setProperty("jsh.home", peer.getHome().getCanonicalPath());
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
					Packages.java.lang.System.setProperty("jsh.engine.rhino.classpath", new Classpath(_urls).local().join($api.jsh.colon));
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
//					var _cl = $api.jsh.shell.getRhinoClassLoader();
//					try {
//						_cl.loadClass("org.mozilla.javascript.Context");
//					} catch (e) {
//						_cl = null;
//					}
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
//			arguments.callee.cached = new Searchpath(String(LOADER_CLASSES.getCanonicalPath()));
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
//			this.shellClasspath = (settings.packaged) ? specified.append(settings.packaged.shellClasspath) : specified;
		};
		_add(rv,shellClasspath);
//		_add(rv,shell.scriptClasspath);

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
		if ($api.shell.environment.PATHEXT) {
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
		elements = p.split($api.jsh.colon);
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
		return elements.join($api.jsh.colon);
	}

	this.ClassLoader = function() {
		var _urls = new $api.java.Array({ type: Packages.java.net.URL, length: elements.length });
		for (var i=0; i<elements.length; i++) {
			_urls[i] = new Packages.java.io.File(elements[i]).toURI().toURL();
			$api.debug("classpath: " + elements[i]);
		}
		var _classloader = new Packages.java.net.URLClassLoader(_urls);
		return _classloader;
	}
}

var getProperty = function(name) {
	var rv = Packages.java.lang.System.getProperty(name);
	if (rv) return String(rv);
	return null;
}

var os = function(pathname,path) {
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
	this.JSH_PLUGINS = new Searchpath(new Directory(getProperty("user.home")).getDirectory(".jsh/plugins").path);
};
settings.use.push(settings.defaults);

$api.debug("jsh.launcher.packaged = " + getProperty("jsh.launcher.packaged"));
if (getProperty("jsh.launcher.packaged") != null) {
	settings.packaged = new function() {
		this.packaged = true;

		var ClassLoader = Packages.java.lang.ClassLoader;

		this.__defineGetter__("source", function() {
			return $api.engine.readUrl( ClassLoader.getSystemResource("main.jsh.js") );
		});

		var tmpdir = new Directory(String($api.io.tmpdir().getCanonicalPath()));

		var index = 0;
		var plugin;
		var plugins = [];
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
			var copyTo = tmpdir.getFile(plugin.name);
			var writeTo = copyTo.writeTo();
			$api.io.copy(plugin.stream,writeTo);
			plugin.stream.close();
			writeTo.close();
			plugins.push(copyTo);
			index++;
			$api.debug("Copied plugin " + index + " from " + plugin.name);
		}

		this.scriptClasspath = [];
		this.JSH_PLUGINS = new Searchpath(plugins);
	}
} else if (getProperty("jsh.home")) {
	settings.built = new function() {
		var JSH_HOME = new Directory( getProperty("jsh.home") );
		$api.debug("JSH_HOME = " + JSH_HOME.path);

		this.scriptClasspath = [];

		this.JSH_PLUGINS = new Searchpath([
			JSH_HOME.getDirectory("plugins"),
			new Directory(getProperty("user.home")).getDirectory(".jsh/plugins")
		]);

		this.profiler = JSH_HOME.getFile("tools/profiler.jar");
	}
} else if ($api.slime.setting("jsh.shell.src")) {
	settings.unbuilt = new function() {
		var SLIME_SRC = new Directory( $api.slime.setting("jsh.shell.src") );

		this.scriptClasspath = [];

//		this.JSH_PLUGINS = new Searchpath([
//			JSH_HOME.getDirectory("plugins"),
//			new Directory(getProperty("user.home")).getDirectory(".jsh/plugins")
//		]);

//		this.profiler = JSH_HOME.getFile("tools/profiler.jar");
	}
}

if (settings.packaged) {
	$api.debug("Using packaged jsh.");
	settings.use.push(settings.packaged);
} else if (settings.built) {
	settings.use.push(settings.built);
} else if (settings.unbuilt) {
	settings.use.push(settings.unbuilt);
}

settings.explicit = new function() {
	var self = this;
	[
		"JSH_LIBRARY_NATIVE"
	].forEach( function(name) {
		self[name] = ($api.shell.environment[name]) ? new Directory($api.shell.environment[name]) : UNDEFINED;
	});

	[
		"JSH_PLUGINS"
	].forEach( function(name) {
		self[name] = (typeof($api.shell.environment[name]) != "undefined") ? new Searchpath($api.shell.environment[name]).toPath() : UNDEFINED;
	});

	if ($api.slime.setting("jsh.plugins")) {
		self.JSH_PLUGINS = new Searchpath($api.slime.setting("jsh.plugins"));
	}

	["JSH_SCRIPT_DEBUGGER"].forEach(function(name) {
		this[name] = $api.shell.environment[name];
	}, this);

	if (!settings.packaged) {
		var httpUrlPattern = /^http(?:s?)\:\/\/(.*)/;
		if (httpUrlPattern.test($api.arguments[0])) {
			debugger;
			this.script = $api.arguments[0];

			this.source = $api.engine.readUrl($api.arguments[0]);
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
				if (new Packages.java.io.File(path).exists()) {
					return new File( String(new Packages.java.io.File(path).getCanonicalPath()) );
				}
				var slash = Packages.java.io.File.separator;
				if (path.indexOf(slash) == -1) {
					$api.debug("PATH = " + $api.shell.environment.PATH);
					var search = $api.shell.environment.PATH.split($api.jsh.colon);
					for (var i=0; i<search.length; i++) {
						if (new Packages.java.io.File(search[i] + slash + arguments[0]).exists()) {
							return new File(String(new Packages.java.io.File(search[i] + slash + path).getCanonicalPath()));
						}
					}
					$api.console("Not found in PATH: " + path);
					Packages.java.lang.System.exit(1);
				} else {
					$api.debug("Working directory: PWD=" + $api.shell.environment.PWD);
					$api.console("Script not found: " + path)
					Packages.java.lang.System.exit(1);
				}
			})($api.arguments[0]);

			this.source = $api.engine.readFile(this.script.path);
		}
	}

	this.jvmOptions = [];

	if ($api.shell.environment.JSH_JVM_OPTIONS) {
		$api.shell.environment.JSH_JVM_OPTIONS.split(" ").forEach( function(option) {
			self.jvmOptions.push(option);
		});
	}
}

//	TODO	allow directive to declare plugin?
settings.directives = function(source) {
	//	TODO	Probably gives JRE, rather than JDK
	var JAVA_HOME = new Directory( getProperty("java.home") );

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
	$api.debug("DIRECTIVES:\n" + directives.join("\n"));
	directives.forEach( function(item) {
		var match;

		if (item.substring(0,1) == "!") {
			//	is #! directive; do nothing
		} else if (match = /^JVM_OPTION\s+(.*)/.exec(item)) {
			directives.jvmOptions.push(match[1]);
		} else if (match = /^CLASSPATH\s+(.*)/.exec(item)) {
			var pathElement = match[1];
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
	//	TODO	Prefer the client VM unless -server is specified (and do not redundantly specify -client)
	//	TODO	At one point, was investigating using jjs as Nashorn launcher; is this still a good idea? If so, would using the
	//			Rhino shell as main make sense for the Rhino case?
		//	Rhino
		//	TODO	implement profiler; see below ... probably needs to move to main script
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
	$api.debug("Creating command ...");
	var command = new $api.java.Command();
	command.addClasspath = function(classpath) {
		for (var i=0; i<classpath.elements.length; i++) {
			this.classpath(classpath.elements[i]);
		}
	}
	command.addClasspathUrls = function(classpath) {
		var local = classpath.local();
		for (var i=0; i<local.length; i++) {
			this.classpath(local[i]);
		}
	}

	var container = (function() {
		//	TODO	test whether next line necessary
		if (settings.packaged) return "jvm";
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
	var _urls = $api.jsh.shell.classpath();
//	Packages.java.lang.System.err.println("engine=" + engine + " _urls=" + _urls);
	command.addClasspathUrls(_urls);
//	Packages.java.lang.System.err.println("command = " + command);
//	command.addClasspath(settings.get("shellClasspath"));
	command.addClasspath(new Searchpath(settings.combine("scriptClasspath")));
	command.main($api.jsh.engine.main);
	command.systemProperty("jsh.plugins", settings.get("JSH_PLUGINS").toPath());
	if (settings.get("script")) {
		command.argument(settings.get("script"));
	} else {
		command.systemProperty("jsh.launcher.packaged", getProperty("jsh.launcher.packaged"));
	}
	var index = (settings.get("script")) ? 1 : 0;
	$api.debug("Skipping: " + index + " arguments");
	//	TODO	below obviously broken for internal launcher
	for (var i=index; i<$api.arguments.length; i++) {
		command.argument($api.arguments[i]);
	}
	var mode = null;
	$api.debug("Running command " + command + " ...");
	var status = command.run(mode);
	$api.jsh.setExitStatus(status);
	$api.debug("Command returned.");
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
} finally {
	//	TODO	the below may be dead code; remove it if it is
//	if (typeof(setExitStatus.value) != "undefined") {
//		exit(setExitStatus.value);
//	}
}