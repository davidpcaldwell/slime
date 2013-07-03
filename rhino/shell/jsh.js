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

//	TODO	ordinarily there is no $context.api.shell referring to the module, but with jsapi unit tests, currently the idea
//			of testing a jsh plugin directly is not supported. So it loads this file as a "module," loads the module.js module
//			separately, and provides it as $context.api.shell. Normally the module.js module would be $exports and this file
//			would just be decorating it.
if ($context.api.shell) {
	$exports.environment = $context.api.shell.environment;
	$exports.properties = $context.api.shell.properties;
	$api.deprecate($exports,"properties");
	$exports.run = $context.api.shell.run;
}

$exports.exit = $context.exit;

//	TODO	this method probably does not make any sense and should probably be replaced with $exports.properties.get(name)
var getProperty = function(name) {
	var value = eval("$exports.properties.object." + name);
	if (String(value) == "undefined") return function(){}();
	if (value == null) return null;
	return String(value);
};

$exports.stdio = $context.stdio;
["readLines", "asString", "asXml"].forEach(function(method) {
	$exports.stdio.input[method] = function(p) {
		return this.character()[method].apply(this.character(), arguments);
	}
});

["output","error"].forEach(function(name) {
	$exports.stdio[name].write = function(p) {
		$exports.stdio[name].character().write(p);
	}
});
$exports.stdin = $exports.stdio.input;
$exports.stdout = $exports.stdio.output;
$exports.stderr = $exports.stdio.error;
$api.deprecate($exports,"stdin");
$api.deprecate($exports,"stdout");
$api.deprecate($exports,"stderr");

$exports.echo = function(message,mode) {
	if (arguments.length == 0) message = "";
	if (!mode) mode = {};

	var streamToConsole = function(stream,toString) {
		var writer = (function() {
			//	TODO	is this redundancy necessary? Does isJavaType(...) need to know it is a Java object?
			if ($context.api.java.isJavaObject(stream) && $context.api.java.isJavaType(Packages.java.io.OutputStream)(stream)) return $context.api.io.adapt(stream).character();
			if ($context.api.java.isJavaObject(stream) && $context.api.java.isJavaType(Packages.java.io.Writer)(stream)) return $context.api.io.adapt(stream);
			if (stream && typeof(stream.character) == "function") return stream.character();
			if (stream && typeof(stream.write) == "function") return stream;
			if (stream && typeof(stream) == "object") throw new TypeError("Not a recognized stream: " + stream + " with properties " + Object.keys(stream));
			throw new TypeError("Not a recognized stream: " + stream);
		})();
		return function(message) {
			writer.write(toString(message)+getProperty("line.separator"));
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

var stream = function(stdio,x) {
	if (typeof(stdio[x]) == "undefined") {
		return $exports.stdio[x];
	}
	return stdio[x];
}

$exports.shell = function(p) {
	var $filesystems = $context.api.file.filesystems;

	if (arguments.length >= 2) {
		$api.deprecate(function() {
			p = $context.api.js.Object.set({}, {
				command: arguments[0],
				arguments: arguments[1]
			}, arguments[2]);
		}).apply(this,arguments);
	}
	if (!p.command) {
		throw new TypeError("No command given: arguments = " + Array.prototype.join.call(arguments,"|"));
	}

	return $exports.run({
		command: (function() {
			//	Accept pathname instead of file for command, for compatibility
			if (p.command.file && !p.command.pathname) {
				$api.deprecate(function() {
					p.command = p.command.file;
				})();				
			}
			if (typeof(p.command) == "string") return p.command;
			if (p.command.pathname) return p.command.pathname;
			throw new TypeError("p.command not string or file");
		})(),
		arguments: p.arguments.map((function() {
			var preprocessor = function(item) { return item; }
			if ($filesystems.cygwin && p.filesystem == $filesystems.os) {
				preprocessor = function(item) {
					return $filesystems.cygwin.toWindows(item);
				}
			} else if ($filesystems.cygwin && p.filesystem == $filesystems.cygwin) {
				preprocessor = function(item) {
					return $filesystems.cygwin.toUnix(item);
				}
			}
			return preprocessor;
		})()),
		environment: p.environment,
		workingDirectory: (function() {
			var work = p.workingDirectory;
			if (!work) return;
			if (work && work.pathname && work.pathname.directory) {
				if ($filesystems.cygwin) {
					return $filesystems.cygwin.toWindows(work.pathname).directory;
				} else {
					return work;
				}
			}
			throw new Error("Unknown working directory: " + work);
		})(),
		evaluate: (function() {
			if (p.evaluate) return p.evaluate;
			if (p.onExit) return $api.deprecate(p.onExit);
		})(),
		stdio: (function() {
			if (p.stdio) return p.stdio;
			if (p.stdin || p.stdout || p.stderr) {
				var xformed = {
					input: p.stdin,
					output: p.stdout,
					error: p.stderr
				}
				return {
					input: stream(xformed,"input"),
					output: stream(xformed,"output"),
					error: stream(xformed,"error")
				};
			}
			if (typeof(p.stdio) == "undefined") return $exports.stdio;
		})()
	});
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
if ($exports.environment.PATH) {
	$exports.PATH = getSearchpath($exports.environment.PATH);
} else if ($exports.environment.Path) {
	//	Windows
	$exports.PATH = getSearchpath($exports.environment.Path);
} else {
	$exports.PATH = $context.api.file.Searchpath([]);
}

$exports.java = function(p) {
	var launcher = arguments.callee.launcher;
	var shell = {
		command: launcher
	};
	var args = [];
	var vmarguments = (p.vmarguments) ? p.vmarguments : [];
	args.push.apply(args,vmarguments);
	for (var x in p) {
		if (x == "classpath") {
			args.push("-classpath", p[x]);
		} else {
			shell[x] = p[x];
		}
	}
	//	TODO	some way of specifying VM arguments
	args.push(p.main);
	shell.arguments = args.concat( (p.arguments) ? p.arguments : [] );
	return $exports.shell(shell);
};
(function() {
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

	//	TODO	Document
	this.launcher = (function() {
		if (this.home.getFile("bin/java")) return this.home.getFile("bin/java");
		if (this.home.getFile("bin/java.exe")) return this.home.getFile("bin/java.exe");
	}).call(this);
}).call($exports.java);
//	TODO	if not running on Rhino, this property should not appear
//	TODO	no test coverage for $exports.rhino
$exports.rhino = new function() {
	if (getProperty("jsh.launcher.rhino.classpath")) {
		this.classpath = getSearchpath(getProperty("jsh.launcher.rhino.classpath"));
	}
};

$exports.jsh = function(p) {
	if (!arguments[0].script && !arguments[0].arguments) {
		p = {
			script: arguments[0],
			arguments: (arguments[1]) ? arguments[1] : []
		};
		for (var x in arguments[2]) {
			p[x] = arguments[2][x];
		}
	}
	if (!p.script) {
		throw new TypeError("Required: script property indicating script to run.");
	}
	if (!p.arguments) {
		p.arguments = [];
	}
	if (p.script.file && !p.script.pathname) {
		$api.deprecate(function() {
			//	User supplied Pathname; should have supplied file
			p.script = p.script.file;
		})();
	}
	//	TODO	need to detect directives in the given script and fork if they are present

	var fork = (function() {
		if (p.fork) return true;
		if (p.classpath) return true;
		if (p.environment && p.environment.JSH_SCRIPT_CLASSPATH) return true;
		if (p.environment && p.environment.JSH_PLUGINS != $exports.environment.JSH_PLUGINS) return true;
		if (p.environment && p.environment.JSH_SCRIPT_DEBUGGER != $exports.environment.JSH_SCRIPT_DEBUGGER) return true;
		return false;
	})();

	var environment = (function() {
		var rv = (p.environment) ? p.environment : {};

		var addProperties = function(from) {
			for (var x in from) {
				if (x != "JSH_LAUNCHER_DEBUG") {
					if (typeof(rv[x]) == "undefined") {
						//	Conversion to string is necessary for $exports.properties.jsh.launcher.environment, which
						//	contains host objects
						rv[x] = String(from[x]);
					}
				}
			}
		}

		addProperties($exports.properties.object.jsh.launcher.environment);
		addProperties($exports.environment);
		return rv;
	})();

	if (fork) {
		debugger;
		//	TODO	can we use $exports.java.home here?
		var jdk = $context.api.file.filesystems.os.Pathname(getProperty("java.home")).directory;
		var executable = $context.api.file.Searchpath([jdk.getRelativePath("bin")]).getCommand("java").toString();
		//	Set defaults from this shell
		var LAUNCHER_CLASSPATH = (p.classpath) ? p.classpath : getProperty("jsh.launcher.classpath");

		var jargs = [];
		jargs.push("-classpath");
		jargs.push(LAUNCHER_CLASSPATH);
		jargs.push("inonit.script.jsh.launcher.Main");

		jargs.push(p.script);
		p.arguments.forEach( function(arg) {
			jargs.push(arg);
		});

		var evaluate = (function() {
			if (p.evaluate) {
				return function(result) {
					result.jsh = {
						script: p.script,
						arguments: p.arguments
					};
					result.classpath = p.classpath;
					return p.evaluate(result);
				}
			}
		})();

		var shell = {
			command: executable,
			arguments: jargs,
			environment: environment,
			stdio: $exports.run.stdio(p),
			evaluate: evaluate
		};

		return $exports.shell(shell);
	} else {
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

						var ifNonNull = function(_type,value,otherwise) {
							if ($context.api.java.isJavaType(_type)(value)) return value;
							if (value && !value.java) throw new TypeError("value: " + value);
							return (value) ? value.java.adapt() : otherwise;
						}
						
						var stdio = (p.stdio) ? p.stdio : {};

						var _stdin = ifNonNull(Packages.java.io.InputStream, stream(stdio,"input"), Streams.Null.INPUT_STREAM);
						var _stdout = ifNonNull(Packages.java.io.OutputStream, stream(stdio,"output"), Streams.Null.OUTPUT_STREAM);
						var _stderr = ifNonNull(Packages.java.io.OutputStream, stream(stdio,"error"), Streams.Null.OUTPUT_STREAM);

						this.getStandardInput = function() {
							return _stdin;
						}

						this.getStandardOutput = function() {
							return _stdout;
						}

						this.getStandardError = function() {
							return _stderr;
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
					if (p.workingDirectory) {
						rv.setProperty("user.dir", p.workingDirectory.pathname.java.adapt());
					}
					return rv;
				}
				
				var _environment = (function() {
					var _map = new Packages.java.util.HashMap();
					for (var x in environment) {
						//	TODO	think through what types might be in environment
						var value = (function() {
							if (typeof(environment[x]) == "undefined") return null;
							if (environment[x] === null) return null;
							return String(environment[x]);
						})();
						_map.put(new Packages.java.lang.String(x),new Packages.java.lang.String(value));
					}
					return Packages.inonit.system.OperatingSystem.Environment.create(_map);
				})();

				this.getEnvironment = function() {
					return _environment;
				};

				this.getStdio = function() {
					return stdio;
				}

				this.getPackagedCode = function() {
					return null;
				}
			}
		);

		if (!p.script || !p.script.pathname || !p.script.pathname.java || !p.script.pathname.java.adapt) {
			throw new TypeError("Expected script " + p.script + " to have pathname.java.adapt()");
		}
		//	TODO	Does Rhino 1.7R3 obviate the need for the Java array conversion stuff?
		var status = $host.jsh(configuration,p.script.pathname.java.adapt(),$context.api.java.toJavaArray(p.arguments,Packages.java.lang.String,function(s) {
			return new Packages.java.lang.String(s);
		}));
		var evaluate = (p.evaluate) ? p.evaluate : function(result) {
			if (result.status != 0) {
				throw new Error("Exit status: " + result.status);
			}
			return result;
		};
		return evaluate({
			status: status,
			//	no error property
			//	no command or arguments
			jsh: {
				script: p.script,
				arguments: p.arguments
			},
			classpath: p.classpath,
			environment: environment,
			workingDirectory: p.workingDirectory
		});
	}
};

if (String($exports.properties.object.jsh.plugins)) {
	$exports.jsh.plugins = $context.api.file.filesystem.Searchpath.parse(String($exports.properties.object.jsh.plugins));
}

var launcherClasspath = $context.api.file.filesystem.Searchpath.parse(String($exports.properties.object.jsh.launcher.classpath));
//	TODO	this is fragile. The above property is, in a built shell:
//			*	supplied by the Java launcher class using the launcher java.class.path property as jsh.launcher.classpath
//			*	supplied by the script launcher to the underlying process as is
//			In the case in which the *launcher* is being profiled, apparently the -javaagent: is *appended* to its java.class.path,
//			so jsh.jar is still first. An earlier implementation made sure the launcher classpath length was 1 also, but that is no
//			longer true in the profiling case.
if (launcherClasspath.pathnames[0] && launcherClasspath.pathnames[0].basename == "jsh.jar") {
	$exports.jsh.home = launcherClasspath.pathnames[0].file.parent;
}
