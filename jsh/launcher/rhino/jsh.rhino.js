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

if (arguments.length == 0 && !Packages.java.lang.System.getProperty("jsh.launcher.packaged")) {
	console("Usage: jsh.rhino.js <script-path> [arguments]");
	exit(1);
}

//	Provide better implementation that uses Java delegate, replacing pure JavaScript version supplied by api.rhino.js
platform.io.copyStream = function(i,o) {
	if (!arguments.callee.delegate) {
		arguments.callee.delegate = new Packages.inonit.script.runtime.io.Streams();
	}
	arguments.callee.delegate.copy(i,o);
}

var File = function(path) {
	this.path = path;

	this.writeTo = function() {
		return new Packages.java.io.FileOutputStream(new Packages.java.io.File(path));
	}
}

var Directory = function(path) {
	var peer = new Packages.java.io.File(path);

	this.path = String(peer.getCanonicalPath());

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
}

var Command = function() {
	var tokens = [];

	this.add = function(o) {
		if (typeof(o) == "string") {
			tokens.push(o);
		} else if (o == null || (typeof(o) == "undefined")) {
			//	ignore
		} else if (typeof(o) == "object" && o.constructor == File) {
			tokens.push(o.path);
		} else if (typeof(o) == "object" && o.constructor == Array) {
			o.forEach( function(item) {
				tokens.push(item);
			});
		}
	}

	this.line = function() {
		return tokens.join(" ");
	}

	this.run = function(mode) {
		var array = (mode) ? [mode] : [];
		return runCommand.apply(this,tokens.concat(array));
	}
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
var ARGUMENTS = arguments;

if (env.JSH_LAUNCHER_DEBUG) {
	debug.on = true;
	debug("debugging enabled");
}

debug("Launcher environment = " + env.toSource());
debug("Launcher working directory = " + getProperty("user.dir"));
debug("Launcher system properties = " + Packages.java.lang.System.getProperties());

var JAVA_HOME = new Directory( (env.JSH_JAVA_HOME) ? os(env.JSH_JAVA_HOME) : getProperty("java.home") );

var settings = {};

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
	this.rhinoClasspath =
		(getProperty("jsh.launcher.rhino.classpath"))
		? new Searchpath(getProperty("jsh.launcher.rhino.classpath"))
		: new Searchpath(getProperty("java.class.path"))
	;
}
debug("jsh.launcher.packaged = " + getProperty("jsh.launcher.packaged"));
if (getProperty("jsh.launcher.packaged") != null) {
	settings.packaged = new function() {
		this.packaged = true;

		var ClassLoader = Packages.java.lang.ClassLoader;

		this.__defineGetter__("source", function() {
			return readUrl( ClassLoader.getSystemResource("main.jsh") );
		});

		debug("Copying rhino ...");
		var rhino = ClassLoader.getSystemResourceAsStream("$jsh/rhino.jar");
		var tmpdir = new Directory(String(createTemporaryDirectory().getCanonicalPath()));
		var rhinoCopiedTo = tmpdir.getFile("rhino.jar");
		var writeTo = rhinoCopiedTo.writeTo();
		platform.io.copyStream(rhino,writeTo);
		rhino.close();
		writeTo.close();

		var index = 0;
		var library;
		var libraries = [];
		debug("Copying libraries ...");
		while( (library = ClassLoader.getSystemResourceAsStream("$libraries/" + String(index) + ".jar")) != null ) {
			var copyTo = tmpdir.getFile(String(index) + ".jar");
			var writeTo = copyTo.writeTo();
			platform.io.copyStream(library,writeTo);
			library.close();
			writeTo.close();
			libraries.push(copyTo);
			index++;
			debug("Copied library " + index);
		}

		this.rhinoClasspath = new Searchpath([ rhinoCopiedTo ]);
		this.shellClasspath = new Searchpath(getProperty("java.class.path"));
		this.scriptClasspath = libraries;
	}
}

if (getProperty("jsh.launcher.home")) {
	settings.built = new function() {
		var JSH_HOME = new Directory( getProperty("jsh.launcher.home") );
		debug("JSH_HOME = " + JSH_HOME.path);

		this.shellClasspath = new Searchpath([JSH_HOME.getFile("lib/jsh.jar").path]);
		this.scriptClasspath = [];
		this.JSH_LIBRARY_MODULES = JSH_HOME.getDirectory("modules");
		this.JSH_LIBRARY_SCRIPTS_LOADER = JSH_HOME.getDirectory("script/platform");
		this.JSH_LIBRARY_SCRIPTS_RHINO = JSH_HOME.getDirectory("script/rhino");
		this.JSH_LIBRARY_SCRIPTS_JSH = JSH_HOME.getDirectory("script/jsh");

		if (platform.cygwin) {
			this.JSH_LIBRARY_NATIVE = JSH_HOME.getDirectory("bin");
		}
	}
}

settings.explicit = new function() {
	this.shellClasspath = (env.JSH_SHELL_CLASSPATH) ? new Searchpath(os(env.JSH_SHELL_CLASSPATH,true)) : UNDEFINED;

	this.scriptClasspath = (env.JSH_SCRIPT_CLASSPATH) ? new Searchpath(os(env.JSH_SCRIPT_CLASSPATH,true)).elements : UNDEFINED;

	var self = this;
	[
		"JSH_LIBRARY_MODULES","JSH_LIBRARY_SCRIPTS_LOADER","JSH_LIBRARY_SCRIPTS_RHINO","JSH_LIBRARY_SCRIPTS_JSH","JSH_TMPDIR",
		"JSH_LIBRARY_NATIVE"
	].forEach( function(name) {
		self[name] = (env[name]) ? new Directory(os(env[name])) : UNDEFINED;
	});
	
	["JSH_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER"].forEach(function(name) {
		this[name] = env[name];
	}, this);

	if (!settings.packaged) {
		this.script = (function(path) {
			/*
			#	Find the file to be executed
			#
			#	We are attempting to support the following usages:
			#	#!/path/to/bash /path/to/jsh/jsh.bash
			#	/path/to/specific/jsh/jsh.bash /path/to/script
			#	/path/to/specific/jsh/jsh.bash /path/to/softlink
			#
			#	Also:
			#	#!/path/to/jsh.bash - works when executed from Cygwin bash shell, does not work on FreeBSD, apparently does not work on
			#		Fedora
			#	/path/to/specific/jsh.bash command - looks up command in PATH, works on Cygwin and FreeBSD, but emits warning message
			#		that usage is unsupported.  See comment below.
			#	#!/path/to/jsh - not yet supported, need to build C wrapper which either invokes bash and this script or recreates the
			#		logic in this script
			#	Development version of jsh which runs directly out of the source tree - undistributed, but noted for reference
			*/
			if (platform.cygwin) {
				path = platform.cygwin.cygpath.windows(arguments[0]);
			}
			if (new Packages.java.io.File(path).exists()) {
				return new File( String(Packages.java.io.File(path).getCanonicalPath()) );
			}
			if (path.indexOf(slash) == -1) {
				debug("PATH = " + env.PATH);
				var search = env.PATH.split(colon);
				for (var i=0; i<search.length; i++) {
					if (new Packages.java.io.File(search[i] + slash + arguments[0]).exists()) {
						return new File(String(new Packages.java.io.File(search[i] + slash + path).getCanonicalPath()));
					}
				}
				console("Not found in PATH: " + path);
				Packages.java.lang.System.exit(1);
			} else {
				debug("Working directory: PWD=" + env.PWD);
				console("Script not found: " + path)
				Packages.java.lang.System.exit(1);
			}
		})(ARGUMENTS[0]);

		this.source = readFile(this.script.path);
	}

	this.jvmOptions = [];

	if (env.JSH_JVM_OPTIONS) {
		env.JSH_JVM_OPTIONS.split(" ").forEach( function(option) {
			self.jvmOptions.push(option);
		});
	}
}

settings.directives = function(source) {
	var directives = source.split("\n").map( function(line) {
		if (line.substring(0,line.length-1) == "\r") {
			return line.substring(0,line.length-1);
		} else {
			return line;
		}
	}).filter( function(line) {
		return /^\#/.test(line);
	}).map( function(line) {
		return line.substring(1);
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
				console("Warning: ignoring #CLASSPATH directive in packaged script: " + match[1]);
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

settings.use = [settings.defaults];
if (settings.packaged) {
	debug("Using packaged jsh.");
	settings.use.push(settings.packaged);
} else {
	debug("Not using packaged jsh.");
	if (settings.built) {
		settings.use.push(settings.built);
	}
	settings.use.push(settings.explicit);
}
settings.get = function(id) {
	var rv;
	for (var i=0; i<this.use.length; i++) {
		if (typeof(this.use[i][id]) != "undefined") {
			rv = this.use[i][id];
		}
	}
	return rv;
}
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

	var script = settings.get("script");
	var source = settings.get("source");

	var command = new Command();
	command.jvmProperty = function(name,value) {
		if (typeof(value) != "undefined") {
			if (typeof(value) == "object" && value != null) {
				if (value.constructor == File || value.constructor == Directory) {
					return arguments.callee.call(this,name,value.path);
				} else {
					throw "Illegal value: "  + value;
				}
			} else if (typeof(value) == "boolean") {
				return arguments.callee.call(this,name,String(value));
			} else {
				this.add("-D" + name + "=" + value);
			}
		}
	}
	command.add(JAVA_HOME.getFile("bin/java"));
	if (env.JSH_JAVA_DEBUGGER) {
		command.add("-Xrunjdwp:transport=dt_shmem,server=y");
	}
	command.add(settings.combine("jvmOptions"));

	[
		"JSH_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER", "JSH_LIBRARY_MODULES", "JSH_LIBRARY_SCRIPTS_LOADER", "JSH_LIBRARY_SCRIPTS_RHINO"
		,"JSH_LIBRARY_SCRIPTS_JSH","JSH_OS_ENV_UNIX"
	].forEach(function(name) {
		var property = name.toLowerCase().split("_").join(".");
		command.jvmProperty(property,settings.get(name));
	});
	
	if (settings.get("JSH_TMPDIR")) {
		command.jvmProperty("java.io.tmpdir",settings.get("JSH_TMPDIR").path);
	}

	if (platform.cygwin) {
		command.jvmProperty("cygwin.root",platform.cygwin.cygpath.windows("/"));
		//	TODO	check for existence of the executable?
		if (!settings.get("JSH_LIBRARY_NATIVE")) {
			console("WARNING: could not start Cygwin paths helper; could not find Cygwin native library path.");
			console("Use JSH_LIBRARY_NATIVE to specify location of Cygwin native libraries.");
		} else {
			command.jvmProperty("cygwin.paths",settings.get("JSH_LIBRARY_NATIVE").getFile("inonit.script.runtime.io.cygwin.cygpath.exe").path);
		}
	}

	[
		"jsh.launcher.packaged", "jsh.launcher.classpath", "jsh.launcher.rhino.classpath", "jsh.launcher.rhino.script"
	].forEach( function(property) {
		if (getProperty(property)) {
			command.jvmProperty(property, getProperty(property));
		}
	} );
	for (var x in env) {
		if (x.substring(0,4) == "JSH_" || x == "PATH") {
			command.jvmProperty("jsh.launcher.environment." + x, env[x]);
		}
	}

	command.add("-classpath");
	command.add(
		settings.get("rhinoClasspath")
		.append(settings.get("shellClasspath"))
		.append(new Searchpath(settings.combine("scriptClasspath")))
		.toPath()
	);
	command.add("inonit.script.jsh.Main");
	command.add(script);
	var index = (script) ? 1 : 0;
	for (var i=index; i<arguments.length; i++) {
		command.add(arguments[i]);
	}
	debug("Environment:");
	debug(env.toSource());
	debug("Command:");
	debug(command.line());
	debugger;
	exit(command.run());
} catch (e) {
	debug("Error:");
	debug(e);
	//	Below works around Rhino debugger bug that does not allow e to be inspected
	debug(e.fileName + ":" + e.lineNumber);
	if (e.rhinoException) {
		e.rhinoException.printStackTrace();
	} else if (typeof(e) == "string") {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e);
	}
	var error = e;
	debugger;
	exit(1);
}
