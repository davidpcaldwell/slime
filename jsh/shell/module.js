//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.exit = $context.exit;
$exports.environment = $context.api.shell.environment;
$exports.properties = $context.api.shell.properties;
$api.experimental($exports,"properties");

["readLines", "asString", "asXml"].forEach(function(method) {
	$context.stdio["in"][method] = function(p) {
		return this.character()[method].apply(this.character(), arguments);
	}
});

$exports.stdin = $context.stdio["in"];

["out","err"].forEach(function(name) {
	$context.stdio[name].write = function(p) {
		$context.stdio[name].character().write(p);
	}
});

$exports.stdout = $context.stdio["out"];

$exports.stderr = $context.stdio["err"];

$exports.echo = function(message,mode) {
	if (arguments.length == 0) message = "";
	if (!mode) mode = {};

	var streamToConsole = function(stream,toString) {
		return function(message) {
			new Packages.java.io.PrintWriter(stream.$getWriter(), true).println(toString(message));
		}
	}

	var console;
	if (mode.console) {
		console = mode.console;
	} else if (mode.stream) {
		console = streamToConsole(mode.stream,arguments.callee.String);
	} else {
		console = streamToConsole($context.api.io.Streams.stdout,arguments.callee.String);
	}

	console(message);
}
$exports.echo.String = function(message) {
	if (typeof(message) == "string") {
		return message;
	} else if (typeof(message) == "number") {
		return String(message);
	} else if (typeof(message) == "boolean") {
		return String(message);
	} else if (typeof(message) == "function") {
		return message.toString();
	} else if (typeof(message) == "xml") {
		return message.toXMLString();
	} else if (message === null) {
		return arguments.callee["null"];
	} else if (typeof(message) == "object") {
		return message.toString();
	} else if (typeof(message) == "undefined") {
		return arguments.callee["undefined"];
	} else {
		if (typeof(message.toString == "function")) {
			return message.toString();
		} else {
			return "Host object: typeof = " + typeof(message);
		}
	}
	return message;
}
$exports.echo.String["undefined"] = "(undefined)";
$exports.echo.String["null"] = "(null)";

var stream = function(mode,x) {
	var Streams = $context.api.io.Streams;
	var isJavaType = $context.api.java.isJavaType;
	var type = (x == "stdin") ? "InputStream" : "OutputStream";
	if (typeof(mode[x]) == "undefined") {
		//	currently Streams.stdin not defined, so no way to get parent process stdin, thus we use empty stream
		if (Streams[x]) {
			return Streams[x]["$get" + type]();
		} else {
			return null;
		}
	}
	if (mode[x] == null) return null;
	if (isJavaType(Packages.java.io[type])(mode[x])) return mode[x];
	return mode[x]["$get" + type]();
}


$exports.shell = function(command,args,mode) {
	if (arguments.length < 3) {
		mode = {};
	}

	var $run = $context.api.shell.run;
	var $filesystems = $context.api.file.filesystems;

	//	If the command is given as a Pathname object, convert it to a host file name for execution.
	if ($filesystems.cygwin) {
		command = $filesystems.cygwin.toWindows( command );
	}

	var preprocessor = function(item) { return item; }
	if ($filesystems.cygwin && mode.filesystem == $filesystems.os) {
		preprocessor = function(item) {
			return $filesystems.cygwin.toWindows(item);
		}
	} else if ($filesystems.cygwin && mode.filesystem == $filesystems.cygwin) {
		preprocessor = function(item) {
			return $filesystems.cygwin.toUnix(item);
		}
	}
	args = args.map( preprocessor );

	var tokens = [ command ].concat( args );

	var rMode = new function() {
		this.environment = mode.environment;

		this.work = (function() {
			if (!mode.workingDirectory) return null;
			var work = mode.workingDirectory;
			if (work.pathname && work.pathname.directory) {
				if ($filesystems.cygwin) {
					return $filesystems.cygwin.toWindows(work.pathname).toString();
				} else {
					return work.pathname.toString();
				}
			}
			throw new Error("Unknown working directory: " + work);
		})();

		this.onExit = mode.onExit;

		this.stdin = stream(mode,"stdin");
		this.stdout = stream(mode,"stdout");
		this.stderr = stream(mode,"stderr");
	};

	$run(tokens,rMode);
}

var getProperty = function(name) {
	var value = eval("$context.api.shell.properties." + name);
	if (String(value) == "undefined") return function(){}();
	if (value == null) return null;
	return String(value);
}

var getMandatoryStringProperty = function(name) {
	var rv = $context.getSystemProperty(name);
	if (!rv) {
		throw new Error("Missing mandatory system property " + name);
	}
	return rv;
};

var getDirectoryProperty = function(name) {
	var rv = $context.api.file.filesystems.os.Pathname($context.getSystemProperty(name));
	rv = $context.api.file.filesystem.$jsh.os(rv);
	return rv.directory;
}

//	converts OS string into jsh.file.Searchpath object in default filesystem
var getSearchpath = function(value) {
	var searchpath = $context.api.file.filesystems.os.Searchpath.parse(value);
	var rv = searchpath.pathnames.map(function(pathname) {
		return $context.api.file.filesystem.$jsh.os(pathname);
	});
	return $context.api.file.Searchpath(rv);
}

$exports.TMPDIR = getDirectoryProperty("java.io.tmpdir");
$exports.USER = getMandatoryStringProperty("user.name");
$exports.HOME = getDirectoryProperty("user.home");
//	TODO	document that this is optional; that there are some environments where "working directory" makes little sense
if ($context.getSystemProperty("user.dir")) {
	$exports.PWD = getDirectoryProperty("user.dir");
}
if ($context.api.shell.environment.PATH) {
	$exports.PATH = getSearchpath($context.api.shell.environment.PATH);
} else {
	$exports.PATH = $context.api.file.Searchpath.createEmpty();
}

$exports.os = new function() {
	this.name = getMandatoryStringProperty("os.name");
	this.arch = getMandatoryStringProperty("os.arch");
	this.version = getMandatoryStringProperty("os.version");
};

$exports.java = new function() {
	this.version = getMandatoryStringProperty("java.version");
	this.vendor = new function() {
		this.toString = function() {
			return getMandatoryStringProperty("java.vendor");
		}

		this.url = getMandatoryStringProperty("java.vendor.url");
	}
	this.home = getDirectoryProperty("java.home");

	var Vvn = function(prefix) {
		this.version = getMandatoryStringProperty(prefix + "version");
		this.vendor = getMandatoryStringProperty(prefix + "vendor");
		this.name = getMandatoryStringProperty(prefix + "name");
	}

	this.vm = new Vvn("java.vm.");
	this.vm.specification = new Vvn("java.vm.specification.");
	this.specification = new Vvn("java.specification.");

	this["class"] = new function() {
		this.version = getMandatoryStringProperty("java.class.version");
		this.path = getSearchpath(getMandatoryStringProperty("java.class.path"));
	}

	//	Convenience alias that omits keyword
	this.CLASSPATH = this["class"].path;

	this.library = new function() {
		this.path = getSearchpath(getMandatoryStringProperty("java.library.path"));
	}

	//	java.io.tmpdir really part of filesystem; see TMPDIR above

	//	Javadoc claims this to be always present but it is sometimes null; we leave it as undefined in that case, although this
	//	behavior is undocumented
	var compiler = $context.getSystemProperty("java.compiler");
	if (compiler) {
		this.compiler = compiler;
	}

	this.ext = new function() {
		this.dirs = getSearchpath(getMandatoryStringProperty("java.ext.dirs"));
	}

	//	os.name, os.arch, os.version handled by $exports.os

	//	file.separator, path.separator, line.separator handled by filesystems in jsh.file

	//	user.name is $exports.USER
	//	user.home is $exports.HOME
	//	user.dir is $exports.PWD
};

//	TODO	if not running on Rhino, this property should not appear
//	TODO	no test coverage for $exports.rhino
$exports.rhino = new function() {
	if (getProperty("jsh.launcher.rhino.classpath")) {
		this.classpath = getSearchpath(getProperty("jsh.launcher.rhino.classpath"));
	}
};

$exports.jsh = function(script,args,mode) {
	//	TODO	need to detect directives in the given script and fork if they are present
	
	var fork = (function() {
		if (mode && mode.classpath) return true;
		if (mode && mode.environment && mode.environment.JSH_SCRIPT_DEBUGGER != $exports.environment.JSH_SCRIPT_DEBUGGER) return true;
		return false;
	})();
	
	var environment = (function() {
		var rv = (mode && mode.environment) ? mode.environment : {};
		
		var addProperties = function(from) {
			for (var x in from) {
				if (x != "JSH_LAUNCHER_DEBUG") {
					if (typeof(rv[x]) == "undefined") {
						//	Conversion to string is necessary for $context.api.shell.properties.jsh.launcher.environment, which
						//	contains host objects
						rv[x] = String(from[x]);
					}
				}
			}			
		}
		
		addProperties($context.api.shell.properties.jsh.launcher.environment);
		addProperties($context.api.shell.environment);
		return rv;
	})();
	
	var configuration = new JavaAdapter(
		Packages.inonit.script.jsh.Shell.Configuration,
		new function() {
			this.getOptimizationLevel = function() {
				return -1;
			};
			
			this.getDebugger = function() {
				//	TODO	an alternative would be to re-use the debugger from this shell; neither seems to work as expected
				if (environment.JSH_SCRIPT_DEBUGGER == "rhino") {
					var Engine = Packages.inonit.script.rhino.Engine;
					return Engine.RhinoDebugger.create(new Engine.RhinoDebugger.Configuration());
				} else {
					return null;
				}
			}

			var stdio = new JavaAdapter(
				Packages.inonit.script.jsh.Shell.Configuration.Stdio,
				new function() {
					var Streams = Packages.inonit.script.runtime.io.Streams;
					var m = (mode) ? mode : {};
					
					var ifNonNull = function(value,otherwise) {
						return (value) ? value : otherwise;
					}
					
					this.getStandardInput = function() {
						return ifNonNull(stream(m,"stdin"), Streams.Null.INPUT_STREAM);
					}
					
					this.getStandardOutput = function() {
						return ifNonNull(stream(m,"stdout"), Streams.Null.OUTPUT_STREAM);
					}
					
					this.getStandardError = function() {
						return ifNonNull(stream(m,"stderr"), Streams.Null.OUTPUT_STREAM);
					}
				}
			);
			
			//	For now, we supply an implementation that logs to stderr, just like the launcher-based jsh does, although it is
			//	possible we should revisit this
			var log = new JavaAdapter(
				Packages.inonit.script.rhino.Engine.Log,
				new function() {
					this.println = function(message) {
						new Packages.java.io.PrintStream(stdio.getStandardError()).println(message);
					}
				}
			);

			this.getLog = function() {
				return log;
			}
			
			this.getClassLoader = function() {
				return Packages.java.lang.ClassLoader.getSystemClassLoader();
			}
			
			this.getSystemProperties = function() {
				var rv = new Packages.java.util.Properties();
				var keys = $context._getSystemProperties().keySet().iterator();
				while(keys.hasNext()) {
					var key = keys.next();
					if (String(key) != "jsh.launcher.packaged") {
						rv.setProperty(key, $context._getSystemProperties().getProperty(key));
					}
				}
				if (mode && mode.workingDirectory) {
					rv.setProperty("user.dir", mode.workingDirectory.pathname.java.adapt());
				}
				return rv;
			}
			
			this.getEnvironment = function() {
				var rv = new Packages.java.util.HashMap();
				for (var x in environment) {
					rv.put(new Packages.java.lang.String(x),new Packages.java.lang.String(environment[x]));
				}
				return rv;
			};
			
			this.getStdio = function() {
				return stdio;
			}
			
			this.getPackagedCode = function() {
				return null;
			}
		}
	);
	
	if (fork) {
		if (!mode) mode = {};
		//	TODO	can we use $exports.java.home here?
		var jdk = $context.api.file.filesystems.os.Pathname(getProperty("java.home")).directory;
		var executable = jdk.getRelativePath("bin/java").toString();
		//	Set defaults from this shell
		var LAUNCHER_CLASSPATH = (mode.classpath) ? mode.classpath : getProperty("jsh.launcher.classpath");

		var jargs = [];
		jargs.push("-classpath");
		jargs.push(LAUNCHER_CLASSPATH);
		jargs.push("inonit.script.jsh.launcher.Main");

		jargs.push(script);
		args.forEach( function(arg) {
			jargs.push(arg);
		});

		mode.environment = environment;

		$exports.shell(executable,jargs,mode);
	} else {
		if (!script.java) {
			throw new TypeError("Expected script " + script + " to have java.adapt()");
		}
		var status = $host.jsh(configuration,script.java.adapt(),$context.api.java.toJavaArray(args,Packages.java.lang.String,function(s) {
			return new Packages.java.lang.String(s);
		}));
		var onExit = (mode && mode.onExit) ? mode.onExit : function(result) {
			if (result.status != 0) {
				throw new Error("Exit status: " + result.status);
			}
		};
		onExit({
			status: status,
			//	no error property
			//	TODO	maybe not strictly the same as rhino/shell run onExit callback, command would be java I would think
			command: script,
			arguments: args,
			environment: environment,
			workingDirectory: (mode && mode.workingDirectory) ? mode.workingDirectory : function(){}()
		});
	}
};

var launcherClasspath = $context.api.file.filesystem.Searchpath.parse(String($exports.properties.jsh.launcher.classpath));
if (launcherClasspath.pathnames.length == 1 && launcherClasspath.pathnames[0].basename == "jsh.jar") {
	$exports.jsh.home = launcherClasspath.pathnames[0].file.parent;
}