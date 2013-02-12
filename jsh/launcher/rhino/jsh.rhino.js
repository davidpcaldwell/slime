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
			} else {
				//	TODO	in Rhino-compatible runCommand this should only work if it is the last argument
				context.setMode(arguments[i]);
			}
		}
		var _builder = new Packages.java.lang.ProcessBuilder(list);
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
		var _out = Spooler.start(this.stdin, delegate.getOutputStream(), true, "stdin from " + this.stdin + ": " + spoolName);
		return delegate.waitFor();
	}

	var runCommand = function() {
		var context = new function() {
			var mode;

			this.setMode = function(value) {
				mode = value;
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
		var list = [];
		for (var i=0; i<arguments.length; i++) {
			if (typeof(arguments[i]) == "string") {
				list.push(arguments[i]);
			} else {
				//	TODO	for fully Rhino-compatible runCommand this should only work if it is the last argument
				context.setMode(arguments[i]);
			}
		}
		//	TODO	for fully Rhino-compatible runCommand we should have special processing of output / err / input
		//			see https://developer.mozilla.org/en-US/docs/Rhino/Shell
		return Packages.inonit.system.OperatingSystem.get().run(
			new JavaAdapter(Packages.inonit.system.Command.Context, context),
			new JavaAdapter(
				Packages.inonit.system.Command.Configuration,
				new function() {
					this.getCommand = function() {
						return new Packages.java.lang.String(list[0]);
					}

					this.getArguments = function() {
						var rv = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.String,list.length-1);
						for (var i=1; i<list.length; i++) {
							rv[i-1] = new Packages.java.lang.String(list[i]);
						}
						return rv;
					}
				}
			)
		).getExitStatus();
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

	this.JSH_PLUGINS = new Directory(getProperty("user.home")).getDirectory(".jsh").path;
};
debug("jsh.launcher.packaged = " + getProperty("jsh.launcher.packaged"));
if (getProperty("jsh.launcher.packaged") != null) {
	settings.packaged = new function() {
		this.packaged = true;

		var ClassLoader = Packages.java.lang.ClassLoader;

		this.__defineGetter__("source", function() {
			return readUrl( ClassLoader.getSystemResource("main.jsh.js") );
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
			platform.io.copyStream(plugin.stream,writeTo);
			plugin.stream.close();
			writeTo.close();
			plugins.push(copyTo);
			index++;
			debug("Copied plugin " + index + " from " + plugin.name);
		}

		this.rhinoClasspath = new Searchpath([ rhinoCopiedTo ]);
		this.shellClasspath = new Searchpath(getProperty("java.class.path"));
		this.scriptClasspath = [];
		this.JSH_PLUGINS = new Searchpath(plugins).toPath();

		var cygwin = ClassLoader.getSystemResourceAsStream("$jsh/bin/inonit.script.runtime.io.cygwin.cygpath.exe");
		if (cygwin != null && platform.cygwin) {
			debug("Copying Cygwin paths helper ...");
			var cygwinTo = tmpdir.getFile("inonit.script.runtime.io.cygwin.cygpath.exe").writeTo();
			platform.io.copyStream(cygwin,cygwinTo);
			cygwin.close();
			cygwinTo.close();
			debug("Copied Cygwin paths helper to " + tmpdir);
			this.JSH_LIBRARY_NATIVE = tmpdir;
		}
	}
}

if (getProperty("jsh.launcher.home")) {
	settings.built = new function() {
		var JSH_HOME = new Directory( getProperty("jsh.launcher.home") );
		debug("JSH_HOME = " + JSH_HOME.path);

		this.shellClasspath = new Searchpath([JSH_HOME.getFile("lib/jsh.jar").path]);
		this.scriptClasspath = [];
		this.JSH_LIBRARY_SCRIPTS_LOADER = JSH_HOME.getDirectory("script/platform");
		this.JSH_LIBRARY_SCRIPTS_RHINO = JSH_HOME.getDirectory("script/rhino");
		this.JSH_LIBRARY_SCRIPTS_JSH = JSH_HOME.getDirectory("script/jsh");
		this.JSH_LIBRARY_MODULES = JSH_HOME.getDirectory("modules");

		if (platform.cygwin) {
			this.JSH_LIBRARY_NATIVE = JSH_HOME.getDirectory("bin");
		}

		this.JSH_PLUGINS = new Searchpath([
			JSH_HOME.getDirectory("plugins"),
			new Directory(getProperty("user.home")).getDirectory(".jsh")
		]);

		this.profiler = JSH_HOME.getFile("tools/profiler.jar");
	}
}

settings.explicit = new function() {
	var shellClasspath = (function() {
		if (!env.JSH_SHELL_CLASSPATH) return UNDEFINED;
		var specified = new Searchpath(os(env.JSH_SHELL_CLASSPATH,true));
		if (!settings.packaged) return specified;
		//	if we are running in a packaged application, we set the loader shell classpath to the specified value plus the package
		//	file location. If the user-specified JSH_SHELL_CLASSPATH contains other classes contained in the package file,
		//	those classes will preferentially be used to those in the package.
		//	TODO	More thinking required about this. The analogous problem exists for unpackaged applications as well.
		return specified.append(settings.packaged.shellClasspath);
	})();
	if (shellClasspath) {
		this.shellClasspath = shellClasspath;
	}

	this.scriptClasspath = (env.JSH_SCRIPT_CLASSPATH) ? new Searchpath(os(env.JSH_SCRIPT_CLASSPATH,true)).elements : UNDEFINED;

	var self = this;
	[
		"JSH_LIBRARY_SCRIPTS_LOADER","JSH_LIBRARY_SCRIPTS_RHINO","JSH_LIBRARY_SCRIPTS_JSH",
		"JSH_LIBRARY_MODULES",
		"JSH_LIBRARY_NATIVE",
		"JSH_TMPDIR"
	].forEach( function(name) {
		self[name] = (env[name]) ? new Directory(os(env[name])) : UNDEFINED;
	});

	[
		"JSH_PLUGINS"
	].forEach( function(name) {
		self[name] = (env[name]) ? new Searchpath(os(env[name],true)).toPath() : UNDEFINED;
	});

	["JSH_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER"].forEach(function(name) {
		this[name] = env[name];
	}, this);

	if (!settings.packaged) {
		var httpUrlPattern = /^http(?:s?)\:\/\/(.*)/;
		if (httpUrlPattern.test(ARGUMENTS[0])) {
			debugger;
			this.script = ARGUMENTS[0];

			this.source = readUrl(ARGUMENTS[0]);
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
}
//	TODO	probably need more thought into which explicit preferences should really apply to packaged applications
//			classpaths are a candidate for things that should not apply
settings.use.push(settings.explicit);

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

	var command = new Command();
	command.jvmProperty = function(name,value) {
		if (typeof(value) != "undefined") {
			if (typeof(value) == "object" && value != null) {
				if (value.constructor == File || value.constructor == Directory) {
					return arguments.callee.call(this,name,value.path);
				} else if (value.constructor == Searchpath) {
					return arguments.callee.call(this,name,value.toPath());
				} else {
					throw new Error("Trying to set " + name + " to illegal object value: "  + value);
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
	} else if (env.JSH_SCRIPT_DEBUGGER == "profiler" || /^profiler\:/.test(env.JSH_SCRIPT_DEBUGGER)) {
		//	TODO	there will be a profiler: version of this variable that probably allows passing a filter to profile only
		//			certain classes and/or scripts; this should be parsed here and the filter option passed through to the agent
		if (settings.get("profiler")) {
			command.add("-javaagent:" + settings.get("profiler").path);
		} else {
			//	TODO	allow explicit setting of profiler agent location when not running in ordinary built shell
			//	emit warning message?
		}
	}
	command.add(settings.combine("jvmOptions"));

	[
		"JSH_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER"
		,"JSH_LIBRARY_SCRIPTS_LOADER", "JSH_LIBRARY_SCRIPTS_RHINO","JSH_LIBRARY_SCRIPTS_JSH"
		,"JSH_LIBRARY_MODULES"
		,"JSH_PLUGINS"
		,"JSH_OS_ENV_UNIX"
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
			console("WARNING: could not locate Cygwin paths helper; could not find Cygwin native library path.");
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
	var shellClasspath = settings.get("shellClasspath");
	if (!shellClasspath) {
		console("Could not find jsh shell classpath: JSH_SHELL_CLASSPATH not defined.");
		exit(1);
	}
	command.add(
		settings.get("rhinoClasspath")
		.append(settings.get("shellClasspath"))
		.append(new Searchpath(settings.combine("scriptClasspath")))
		.toPath()
	);
	command.add("inonit.script.jsh.Main");
	command.add(settings.get("script"));
	var index = (settings.get("script")) ? 1 : 0;
	for (var i=index; i<arguments.length; i++) {
		command.add(arguments[i]);
	}
	debug("Environment:");
	debug(env.toSource());
	debug("Command:");
	debug(command.line());
	debugger;
	var mode = {
		input: Packages.java.lang.System["in"],
		output: Packages.java.lang.System["out"],
		err: Packages.java.lang.System["err"]
	};
	debug("Running command ...");
	exit(command.run(mode));
	debug("Command returned.");
} catch (e) {
	debug("Error:");
	debug(e);
	//	Below works around Rhino debugger bug that does not allow e to be inspected
	debug(e.fileName + ":" + e.lineNumber);
	if (e.rhinoException) {
		e.rhinoException.printStackTrace();
	} else if (typeof(e) == "string") {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e);
	} else if (e instanceof Error) {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e.message);
	}
	var error = e;
	debugger;
	exit(1);
}