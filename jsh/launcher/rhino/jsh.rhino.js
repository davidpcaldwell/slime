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

var setExitStatus = function(status) {
	var _field = Packages.java.lang.Class.forName("org.mozilla.javascript.tools.shell.Main").getDeclaredField("exitCode");
	_field.setAccessible(true);
	_field.set(null, new Packages.java.lang.Integer(status));
}

var newStringArray = function(len) {
	return Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.String,len);		
};

if (Packages.java.lang.System.getProperty("jsh.launcher.nashorn")) {
	arguments = $arguments;
	setExitStatus = function(status) {
		exit(status);
	}
	newStringArray = function(len) {
		return Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.String.class,len);		
	}
}

if (arguments.length == 0 && !Packages.java.lang.System.getProperty("jsh.launcher.packaged")) {
	console("Usage: jsh.rhino.js <script-path> [arguments]");
	Packages.java.lang.System.exit(1);
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
			
			//	NASHORN	Under Rhino, these were implied
			this.getSubprocessEnvironment = function() {
				return null;
			};
			
			this.getWorkingDirectory = function() {
				return null;
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
						var rv = newStringArray(list.length-1);
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

	this.JSH_PLUGINS = new Directory(getProperty("user.home")).getDirectory(".jsh/plugins").path;
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
		this.JSH_LIBRARY_SCRIPTS_LOADER = JSH_HOME.getDirectory("script/loader");
		this.JSH_LIBRARY_SCRIPTS_JSH = JSH_HOME.getDirectory("script/jsh");
		this.JSH_LIBRARY_MODULES = JSH_HOME.getDirectory("modules");

		if (platform.cygwin) {
			this.JSH_LIBRARY_NATIVE = JSH_HOME.getDirectory("bin");
		}

		this.JSH_PLUGINS = new Searchpath([
			JSH_HOME.getDirectory("plugins"),
			new Directory(getProperty("user.home")).getDirectory(".jsh/plugins")
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
		"JSH_LIBRARY_SCRIPTS_LOADER","JSH_LIBRARY_SCRIPTS_JSH",
		"JSH_LIBRARY_MODULES",
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

	["JSH_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER"].forEach(function(name) {
		this[name] = env[name];
	}, this);

	["JSH_JAVA_LOGGING_PROPERTIES"].forEach(function(name) {
		this[name] = (typeof(env[name]) != "undefined") ? new File(os(env[name])) : UNDEFINED;
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
					return new File( String(new Packages.java.io.File(path).getCanonicalPath()) );
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

			//	NASHORN	report incompatibility
			if (typeof(readFile) == "undefined") {
				readFile = function(path) {
					var rv = "";
					var reader = new Packages.java.io.FileReader(path);
					var c;
					while((c = reader.read()) != -1) {
						var _character = new Packages.java.lang.Character(c);
						rv += _character.toString();
					}
					return rv;
				}
			}
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
	debugger;
	var jvmOptions = settings.combine("jvmOptions");
	
	var environmentAndProperties = function() {
		[
			"JSH_OPTIMIZATION", "JSH_SCRIPT_DEBUGGER"
			,"JSH_LIBRARY_SCRIPTS_LOADER", "JSH_LIBRARY_SCRIPTS_JSH"
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

		if (settings.get("JSH_JAVA_LOGGING_PROPERTIES")) {
			command.jvmProperty("java.util.logging.config.file",settings.get("JSH_JAVA_LOGGING_PROPERTIES").path);
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
	}
	
	var shellClasspath = settings.get("shellClasspath");
	if (!shellClasspath) {
		console("Could not find jsh shell classpath: JSH_SHELL_CLASSPATH not defined.");
		Packages.java.lang.System.exit(1);
	}
	
	var scriptClasspath = new Searchpath(settings.combine("scriptClasspath"));
	
	//	Prefer the client VM unless -server is specified (and do not redundantly specify -client)
	if (JAVA_HOME.getDirectory("bin").getCommand("jjs") && env.JSH_ENGINE != "rhino") {
//	if (JAVA_HOME.getDirectory("bin").getCommand("jjs") && env.JSH_ENGINE == "nashorn") {
		//	Nashorn
		var JJS = false;
		if (JJS) {
			command.add(JAVA_HOME.getDirectory("bin").getCommand("jjs"));
		} else {
			command.add(JAVA_HOME.getDirectory("bin").getCommand("java"));			
		}
		//	TODO	handle JSH_JAVA_DEBUGGER
		//	TODO	handle JSH_SCRIPT_DEBUGGER == "profiler"
		//	TODO	decide about client-vs.-server VM, probably not needed
		if (jvmOptions.length) {
			throw new Error("Unimplemented: Nashorn options");
		}
		environmentAndProperties();
		command.add("-classpath");
		command.add(shellClasspath.append(scriptClasspath).toPath());
		if (JJS) {
			command.add(settings.get("JSH_LIBRARY_SCRIPTS_JSH").getFile("nashorn-host.js").path);
			command.add(settings.get("JSH_LIBRARY_SCRIPTS_JSH").getFile("jsh.js").path);
			command.add("--");
		} else {
			command.add("inonit.script.jsh.Nashorn");
		}
	} else {
		//	Rhino
		command.add(JAVA_HOME.getDirectory("bin").getCommand("java"));
		if (env.JSH_JAVA_DEBUGGER) {
			//	TODO	this option seems to have changed as of Java 5 or Java 6 to agentlib or agentpath
			//			see http://docs.oracle.com/javase/6/docs/technotes/guides/jpda/conninv.html
			command.add("-Xrunjdwp:transport=dt_shmem,server=y");
		} else if (env.JSH_SCRIPT_DEBUGGER == "profiler" || /^profiler\:/.test(env.JSH_SCRIPT_DEBUGGER)) {
			//	TODO	there will be a profiler: version of this variable that probably allows passing a filter to profile only
			//			certain classes and/or scripts; this should be parsed here and the filter option passed through to the agent
			if (settings.get("profiler")) {
				var withParameters = /^profiler\:(.*)/.exec(env.JSH_SCRIPT_DEBUGGER);
				if (withParameters) {
					command.add("-javaagent:" + settings.get("profiler").path + "=" + withParameters[1]);
				} else {
					command.add("-javaagent:" + settings.get("profiler").path);
				}
			} else {
				//	TODO	allow explicit setting of profiler agent location when not running in ordinary built shell
				//	emit warning message?
			}
		}
		if (jvmOptions.indexOf("-server") == -1 && jvmOptions.indexOf("-client") == "-1") {
			jvmOptions.unshift("-client");
		}
		command.add(jvmOptions);
		environmentAndProperties();
		command.add("-classpath");
		command.add(
			settings.get("rhinoClasspath")
			.append(shellClasspath)
			.append(scriptClasspath)
			.toPath()
		);
		command.add("inonit.script.jsh.Rhino");
	}
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
	var status = command.run(mode);
	if (status === null) {
		throw new Error("Exit status null.");
	}
	setExitStatus(status);
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
	setExitStatus(1);
}