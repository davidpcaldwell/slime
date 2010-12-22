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

if (arguments.length == 0) {
	console("Usage: jsh.rhino.js <script-path> [arguments]");
	exit(1);
}

var File = function(path) {
	this.path = path;
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

if (env.JSH_DEBUG || env.JSH_LAUNCHER_DEBUG) {
	debug.on = true;
	debug("debugging enabled");
}

debug("Launcher environment = " + env.toSource());
debug("Launcher working directory = " + getProperty("user.dir"));

var JAVA_HOME = new Directory( (env.JSH_JAVA_HOME) ? os(env.JSH_JAVA_HOME) : getProperty("java.home") );
var JSH_HOME;
if (getProperty("jsh.home")) {
	JSH_HOME = new Directory( getProperty("jsh.home") );
	debug("JSH_HOME = " + JSH_HOME.path);
}
try {
	//	The jsh.rhino.classpath property was already processed by the Launcher class to be in OS-format, because it was used to
	//	create the classloader inside which we are executing
	var rhinoClasspath = 
		(getProperty("jsh.rhino.classpath"))
		? new Searchpath(getProperty("jsh.rhino.classpath"))
		: new Searchpath(getProperty("java.class.path"))
	;

	//	TODO	Could contemplate including XMLBeans in rhinoClasspath if found:
	//
	//	if [ -z $JSH_RHINO_CLASSPATH ]; then
	//		JSH_RHINO_CLASSPATH=$JSH_HOME/lib/js.jar
	//		if [ -f $JSH_HOME/lib/xbean.jar ]; then
	//			#	Include XMLBeans
	//			JSH_RHINO_CLASSPATH=$JSH_RHINO_CLASSPATH:$JSH_HOME/lib/xbean.jar:$JSH_HOME/lib/jsr173_1.0_api.jar
	//		fi
	//	fi

	if (!env.JSH_SHELL_CLASSPATH && !JSH_HOME) throw "Missing jsh classes: specify environment variable JSH_SHELL_CLASSPATH";
	var shellClasspath = (env.JSH_SHELL_CLASSPATH) ? new Searchpath(os(env.JSH_SHELL_CLASSPATH,true)) : new Searchpath(JSH_HOME.getFile("lib/jsh.jar").path);

	var scriptClasspath = (env.JSH_SCRIPT_CLASSPATH) ? new Searchpath(os(env.JSH_SCRIPT_CLASSPATH,true)) : new Searchpath();

	if (!env.JSH_LIBRARY_MODULES && !JSH_HOME) throw "Missing jsh modules: specify environment variable JSH_LIBRARY_MODULES";
	var JSH_LIBRARY_MODULES = (env.JSH_LIBRARY_MODULES) ? new Directory(os(env.JSH_LIBRARY_MODULES)) : JSH_HOME.getDirectory("modules");
	if (!env.JSH_LIBRARY_SCRIPTS_JS_PLATFORM && !JSH_HOME) throw "Missing platform loader: specify environment variable JSH_LIBRARY_SCRIPTS_JS_PLATFORM";
	var JSH_LIBRARY_SCRIPTS_JS_PLATFORM = (env.JSH_LIBRARY_SCRIPTS_JS_PLATFORM) ? new Directory(os(env.JSH_LIBRARY_SCRIPTS_JS_PLATFORM)) : JSH_HOME.getDirectory("script/platform");
	if (!env.JSH_LIBRARY_SCRIPTS_RHINO && !JSH_HOME) throw "Missing rhino loader: specify environment variable JSH_LIBRARY_SCRIPTS_RHINO";
	var JSH_LIBRARY_SCRIPTS_RHINO = (env.JSH_LIBRARY_SCRIPTS_RHINO) ? new Directory(os(env.JSH_LIBRARY_SCRIPTS_RHINO)) : JSH_HOME.getDirectory("script/rhino");
	if (!env.JSH_LIBRARY_SCRIPTS_JSH && !JSH_HOME) throw "Missing platform loader: specify environment variable JSH_LIBRARY_SCRIPTS_JSH";
	var JSH_LIBRARY_SCRIPTS_JSH = (env.JSH_LIBRARY_SCRIPTS_JSH) ? new Directory(os(env.JSH_LIBRARY_SCRIPTS_JSH)) : JSH_HOME.getDirectory("script/jsh");

	var JSH_TMPDIR = (env.JSH_TMPDIR) ? new Directory(os(env.JSH_TMPDIR)) : null;

	var JSH_OS_ENV;
	var JSH_LIBRARY_NATIVE;

	(function() {
		if (platform.unix) {
			//	TODO	allow this to be overridden by environment variable
			JSH_OS_ENV = os("/usr/bin/env");
		}

		if (platform.cygwin) {
			//	When running on Cygwin, use /tmp as default temporary directory rather than the Windows JDK/JRE default
			if (!JSH_TMPDIR) JSH_TMPDIR = new Directory(os("/tmp"));

			JSH_LIBRARY_NATIVE = (function() {
				if (env.JSH_LIBRARY_NATIVE) {
					return new Directory(os(env.JSH_LIBRARY_NATIVE));
				} else if (JSH_HOME) {
					return JSH_HOME.getDirectory("bin");
				}
			})();
		}
	})();

	/*
	#	Find the file to be executed
	#
	#	We are attempting to support the following usages:
	#	#!/path/to/bash /path/to/jsh/jsh.bash
	#	/path/to/specific/jsh/jsh.bash /path/to/script
	#	/path/to/specific/jsh/jsh.bash /path/to/softlink
	#
	#	Also:
	#	#!/path/to/jsh.bash - works when executed from Cygwin bash shell, does not work on FreeBSD, apparently does not work on Fedora
	#	/path/to/specific/jsh.bash command - looks up command in PATH, works on Cygwin and FreeBSD, but emits warning message that usage
	#		is unsupported.  See comment below.
	#	#!/path/to/jsh - not yet supported, need to build C wrapper which either invokes bash and this script or recreates the logic
	#		in this script
	#	Development version of jsh which runs directly out of the source tree - undistributed, but noted for reference
	*/
	var script = (function(path) {
		if (platform.cygwin) {
			path = platform.cygwin.cygpath.windows(arguments[0]);
		}
		if (new Packages.java.io.File(path).exists()) {
			return new File( String(Packages.java.io.File(path).getCanonicalPath()) );
		}
		if (path.indexOf("/") == -1 || path.indexOf("\\") == -1) {
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
	})(arguments[0]);

	var source = readFile(script.path);

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
			directives.classpath.push(new File(pathElement));
		} else if (match = /^JDK_LIBRARY\s+(.*)/.exec(item)) {
			directives.jdkLibraries.push(JAVA_HOME.getFile(match[1]));
		} else {
			//	unrecognized directive
		}
	} );

	if (env.JSH_JVM_OPTIONS) {
		env.JSH_JVM_OPTIONS.split(" ").forEach( function(option) {
			directives.jvmOptions.push(option);
		});
	}

	var command = new Command();
	command.jvmProperty = function(name,value) {
		if (typeof(value) != "undefined") {
			this.add("-D" + name + "=" + value);
		}
	}
	command.add(JAVA_HOME.getFile("bin/java"));
	if (env.JSH_JAVA_DEBUGGER) {
		command.add("-Xrunjdwp:transport=dt_shmem,server=y");
	}
	command.add(directives.jvmOptions);
	//	TODO	Maybe the shell should just use these environment variables, rather than having this rigamarole
	command.jvmProperty("jsh.optimization",env.JSH_OPTIMIZATION);
	command.jvmProperty("jsh.script.debugger",(function() {
		if (env.JSH_SCRIPT_DEBUGGER) return env.JSH_SCRIPT_DEBUGGER;
		if (env.JSH_DEBUG) return "rhino";
	})());
	command.jvmProperty("jsh.library.modules",JSH_LIBRARY_MODULES.path);
	command.jvmProperty("jsh.library.scripts.loader",JSH_LIBRARY_SCRIPTS_JS_PLATFORM.path);
	command.jvmProperty("jsh.library.scripts.rhino",JSH_LIBRARY_SCRIPTS_RHINO.path);
	command.jvmProperty("jsh.library.scripts.jsh",JSH_LIBRARY_SCRIPTS_JSH.path);
	command.jvmProperty("jsh.os.env.unix",JSH_OS_ENV);
	if (JSH_TMPDIR) {
		command.jvmProperty("java.io.tmpdir",JSH_TMPDIR.path);
	}

	if (platform.cygwin) {
		command.jvmProperty("cygwin.root",platform.cygwin.cygpath.windows("/"));
		//	TODO	check for existence of the executable?
		if (!JSH_LIBRARY_NATIVE) {
			console("WARNING: could not start Cygwin paths helper; could not find Cygwin native library path.");
			console("Use JSH_LIBRARY_NATIVE to specify location of Cygwin native libraries.");
		} else {
			command.jvmProperty("cygwin.paths",JSH_LIBRARY_NATIVE.getFile("inonit.script.runtime.io.cygwin.cygpath.exe").path);
		}
	}

	//	launcher properties that are only sent as informational (they can be used to launch subscripts)
	command.jvmProperty("jsh.launcher.classpath", getProperty("java.class.path"));
	command.jvmProperty("jsh.launcher.rhino.classpath", rhinoClasspath.toPath());
	command.jvmProperty("jsh.launcher.rhino.script", getProperty("jsh.launcher.rhino.script"));
	command.jvmProperty("jsh.launcher.shell.classpath", shellClasspath.toPath());
	command.jvmProperty("jsh.launcher.script.classpath", scriptClasspath.toPath());
	if (JSH_LIBRARY_NATIVE) {
		command.jvmProperty("jsh.launcher.library.native",JSH_LIBRARY_NATIVE.path);
	}

	command.add("-classpath");
	command.add(
		rhinoClasspath
		.append(shellClasspath)
		.append(scriptClasspath)
		.append(new Searchpath(directives.jdkLibraries))
		.append(new Searchpath(directives.classpath))
		.toPath()
	);
	command.add("inonit.script.jsh.Main");
	command.add(script);
	for (var i=1; i<arguments.length; i++) {
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
