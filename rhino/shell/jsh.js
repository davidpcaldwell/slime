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
	for (var x in $context.api.shell) {
		$exports[x] = $context.api.shell[x];
	}
}

$exports.exit = $context.exit;

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
			writer.write(toString(message)+$exports.properties.get("line.separator"));
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
	var run = $context.api.js.Object.set({}, p);
	(function() {
		if (run.command.file && !run.command.pathname) {
			$api.deprecate(function() {
				//	Pathname given; turn into file
				run.command = run.command.file;
			})();
		}
		if (typeof(run.command) == "string") {
			$api.deprecate(function() {
				//	string given; mark but do nothing
				var breakpoint = 1;
			})();
			return;
		}
		if (!run.command.pathname) {
			throw new TypeError("command property is not a file");
		}
	})();
	(function() {
		var preprocessor = function(item) {
			if (run.filesystem) {
				if (item.java && item.java.adapt && run.filesystem.java && run.filesystem.java.adapt) {
					var _file = item.java.adapt();
					return run.filesystem.java.adapt(_file);
				}
			}
			return item;
		};
		if (run.arguments) {
			run.arguments = run.arguments.map(preprocessor);
		}
	})();
	(function() {
		if (!run.evaluate && run.onExit) {
			run.evaluate = $api.deprecate(run.onExit);
		}
	})();

	return $exports.run(run);
}

//	TODO	is rhino/file.filesystem.$jsh.os(...) still necessary? Was used here.

//	TODO	make sure documentation correctly reflects presence of this property: this property being present does not mean Rhino
//			is executing this script, just that it is present
if ($exports.properties.get("jsh.engine.rhino.classpath")) {
	$exports.rhino = new function() {
		this.classpath = $exports.properties.searchpath("jsh.engine.rhino.classpath");
	};
};

$exports.jsh = function(p) {
	if (!arguments[0].script && !arguments[0].arguments) {
		$api.deprecate(function() {
			p = {
				script: arguments[0],
				arguments: (arguments[1]) ? arguments[1] : []
			};
			for (var x in arguments[2]) {
				p[x] = arguments[2][x];
			}
		}).apply(this,arguments);
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
		if (p.environment && p.environment.JSH_DEBUG_SCRIPT != $exports.environment.JSH_DEBUG_SCRIPT) return true;
		if (p.shell) return true;
		//	TODO	allow unforked URL-based scripts
		if (typeof(p.script.resolve) == "function") return true;
		return false;
	})();

	//	TODO	Probably if p.shell is specified and p.environment is not, we should strip out all variables starting with JSH_,
	//			which would provide the least counterintuitive behavior. For example, if called from unbuilt shell, we would want
	//			a launched built shell to have all the unbuilt shell environment variables removed.

//	var environment = (function() {
//		//	TODO	this code below is counter-intuitive and should be cleaned up and/or documented; order is reverse of what you'd
//		//			think (and what jsh.js.Object.set(...) for example would do).
//		var addProperties = function(from) {
//			for (var x in from) {
//				if (x != "JSH_LAUNCHER_DEBUG") {
//					if (typeof(rv[x]) == "undefined") {
//						//	Conversion to string is necessary for $exports.properties.jsh.launcher.environment, which
//						//	contains host objects
//						rv[x] = String(from[x]);
//					}
//				}
//			}
//		}
//
//		var rv = {};
//		addProperties((p.environment) ? p.environment : {});
//		addProperties($exports.properties.object.jsh.launcher.environment);
//		addProperties($exports.environment);
//
//		return rv;
//	})();
	var environment = (function() {
		if (p.environment) return p.environment;
		if (p.shell) {
			var rv = {};
			for (var x in $exports.environment) {
				if (/^JSH_/.test(x) && !/^JSH_HOST_/.test(x)) {

				} else {
					rv[x] = $exports.environment[x];
				}
			}
			return rv;
		}
		return $exports.environment;
	})();

	if (fork) {
		//	TODO	can we use $exports.java.home here?
//		var jdk = $context.api.file.filesystems.os.Pathname($exports.properties.get("java.home")).directory;
//		var executable = $context.api.file.Searchpath([jdk.getRelativePath("bin")]).getCommand("java");
//
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

		var addCommandTo = function(jargs,script) {
			if (p.vmarguments) {
				p.vmarguments.forEach(function(argument) {
					jargs.push(argument);
				});
			}
			if (p.properties) {
				for (var x in p.properties) {
					jargs.push("-D" + x + "=" + p.properties[x]);
				}
			}
			jargs.push(script);
			p.arguments.forEach( function(arg) {
				jargs.push(arg);
			});
			return jargs;
		}

		var scripts = (function(shell) {
			var remote = function(url) {
				return [
					"-e",
					"load('" + url.resolve("rhino/jrunscript/api.js?jsh") + "')"
				];
			}

			var unbuilt = function(src) {
				return [
					src.getFile("rhino/jrunscript/api.js"),
					"jsh"
				];
			};

			var built = function(home) {
				return [
					home.getFile("jsh.js")
				]
			};

			if (shell) {
				//	TODO	should contemplate possibility of URL, I suppose
				if (shell.getFile("jsh.js")) {
					return built(shell);
				}
				if (shell.getFile("rhino/jrunscript/api.js")) {
					return unbuilt(shell);
				}
				throw new Error("Shell not found: " + shell);
			}
			if ($exports.jsh.home) return built($exports.jsh.home);
			if ($exports.jsh.src) return unbuilt($exports.jsh.src);
			if ($exports.jsh.url) return remote($exports.jsh.url);
			//	TODO	would unbuilt remote shells have a src property, and would it work?
			throw new Error("Running shell lacks home, src, and url properties; jsh bug.");
		})(p.shell);

		//	Properties to be sent to main.js launcher; other properties will be sent as arguments using addCommandTo
		var outerProperties = {};
		if (p.classpath) {
			outerProperties["jsh.shell.classpath"] = String(p.classpath);
		}
		var copyPropertyIfPresent = function(name) {
			//	TODO	is the below redundant with an API we already have for accessing the value (other than system property?)
			if (Packages.java.lang.System.getProperty(name)) {
				outerProperties[name] = String(Packages.java.lang.System.getProperty(name));
			}
		}
		copyPropertyIfPresent("jsh.engine.rhino.classpath");
		if (scripts[0] == "-e") {
			//	remote shell
			copyPropertyIfPresent("http.proxyHost");
			copyPropertyIfPresent("http.proxyPort");
		}
		var argument = $context.api.js.Object.set({}, p, {
			environment: environment,
			vmarguments: [],
			properties: outerProperties,
			arguments: addCommandTo(scripts,p.script),
			evaluate: evaluate
		});
		return $exports.jrunscript(argument);
//		} else {
//			if (p.shell.getFile("jsh.js")) {
//				//	Built shell
//				return $exports.jrunscript($context.api.js.Object.set({}, p, {
//					arguments: addCommandTo([p.shell.getFile("jsh.js")],p.properties),
//					environment: environment,
//					evaluate: evaluate
//				}));
//			} else if (p.shell.getFile("rhino/jrunscript/api.js")) {
//				var args = [p.shell.getFile("rhino/jrunscript/api.js"), p.shell.getFile("jsh/launcher/main.js")];
//				//	TODO	will only work if they start with dash, which they must, right?
////				if (p.properties) {
////					for (var x in p.properties) {
////						args.push("-D" + x + "=" + p.properties[x]);
////					}
////					delete p.properties;
////				}
//				if (p.vmarguments) {
//					for (var i=0; i<p.vmarguments.length; i++) {
//						args.push(p.vmarguments[i]);
//					}
//				}
//				return $exports.jrunscript($context.api.js.Object.set({}, p, {
//					arguments: addCommandTo(args,p.properties),
//					environment: environment,
//					evaluate: evaluate
//				}));
//			} else {
//				throw new Error("Shell not found: " + p.shell);
//			}
//		}
	} else {
		var configuration = new JavaAdapter(
			Packages.inonit.script.jsh.Shell.Environment,
			new function() {
//				this.getOptimizationLevel = function() {
//					return -1;
//				};
//
//				this.getDebugger = function() {
//					//	TODO	an alternative would be to re-use the debugger from this shell; neither seems to work as expected
//					if (environment.JSH_SCRIPT_DEBUGGER == "rhino") {
//						var Engine = Packages.inonit.script.rhino.Engine;
//						return Engine.RhinoDebugger.create(Engine.RhinoDebugger.Configuration.create(
//							Packages.inonit.script.rhino.Gui.RHINO_UI_FACTORY
//						));
//					} else {
//						return null;
//					}
//				}

				var stdio = new JavaAdapter(
					Packages.inonit.script.jsh.Shell.Environment.Stdio,
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

//				//	For now, we supply an implementation that logs to stderr, just like the launcher-based jsh does, although it is
//				//	possible we should revisit this
//				var log = new JavaAdapter(
//					Packages.inonit.script.rhino.Engine.Log,
//					new function() {
//						this.println = function(message) {
//							new Packages.java.io.PrintStream(stdio.getStandardError()).println(message);
//						}
//					}
//				);

//				this.getLog = function() {
//					return log;
//				}

				this.getClassLoader = function() {
					return Packages.java.lang.ClassLoader.getSystemClassLoader();
				}

				this.getSystemProperties = function() {
					var rv = new Packages.java.util.Properties();
					var keys = $context._getSystemProperties().keySet().iterator();
					while(keys.hasNext()) {
						var key = keys.next();
//						if (String(key) != "jsh.shell.packaged") {
							if ($context._getSystemProperties().getProperty(key) == null) {
								//	TODO	seems to be the case for jsh.launcher.shell, through an unknown set of mechanisms
							} else {
								rv.setProperty(key, $context._getSystemProperties().getProperty(key));
							}
//						}
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

				this.getPackaged = function() {
					return null;
				};
			}
		);

		if (!p.script || !p.script.pathname || !p.script.pathname.java || !p.script.pathname.java.adapt) {
			throw new TypeError("Expected script " + p.script + " to have pathname.java.adapt()");
		}
		var status = $context.jsh(
			configuration,
			p.script,
			p.arguments
		);
		var evaluate = (p.evaluate) ? p.evaluate : function(result) {
			if (result.status === null) {
				result.status = 0;
			}
			if (result.status) {
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

//if (String($exports.properties.object.jsh.plugins)) {
//	$exports.jsh.plugins = $context.api.file.filesystem.Searchpath.parse(String($exports.properties.object.jsh.plugins));
//}

if ($exports.properties.object.jsh.shell && $exports.properties.object.jsh.shell.home) {
	$exports.jsh.home = $context.api.file.Pathname($exports.properties.object.jsh.shell.home).directory
}
if ($exports.properties.object.jsh.shell && $exports.properties.object.jsh.shell.src) {
	(function() {
		var src = String($exports.properties.object.jsh.shell.src);
		if ($context.api.file.Pathname(src).directory) {
			$exports.jsh.src = $context.api.file.Pathname(src).directory;
		} else {
			$exports.jsh.url = $context.api.js.web.Url.parse(src);
		}
	})();
}
if ($exports.properties.object.jsh.shell && $exports.properties.object.jsh.shell.lib) {
	$exports.jsh.lib = $context.api.file.Pathname($exports.properties.object.jsh.shell.lib).directory;
} else if ($exports.jsh.home) {
	$exports.jsh.lib = $exports.jsh.home.getSubdirectory("lib");
}
//var launcherClasspath = $context.api.file.filesystem.Searchpath.parse(String($exports.properties.object.jsh.launcher.classpath));
////	TODO	this is fragile. The above property is, in a built shell:
////			*	supplied by the Java launcher class using the launcher java.class.path property as jsh.launcher.classpath
////			*	supplied by the script launcher to the underlying process as is
////			In the case in which the *launcher* is being profiled, apparently the -javaagent: is *appended* to its java.class.path,
////			so jsh.jar is still first. An earlier implementation made sure the launcher classpath length was 1 also, but that is no
////			longer true in the profiling case.
//if (launcherClasspath.pathnames[0] && launcherClasspath.pathnames[0].basename == "jsh.jar") {
//	//	TODO	find better way to get this value; if using global, should use jsh.home system property, but should actually find
//	//			a way to pass it through the shell instantiation process
//	$exports.jsh.home = launcherClasspath.pathnames[0].file.parent;
//}