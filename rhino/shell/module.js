//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (!$context.api.io) {
	throw new Error("Missing: $context.api.io");
}

$exports.run = function(p) {
	var as;
	if (p.as) {
		as = p.as;
	}
	var stdio = arguments.callee.stdio(p);
	var directory = arguments.callee.directory(p);
	var context = new JavaAdapter(
		Packages.inonit.system.Command.Context,
		new function() {
			this.getStandardOutput = function() {
				return (stdio && stdio.output) ? stdio.output.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM;
			};

			this.getStandardError = function() {
				return (stdio && stdio.error) ? stdio.error.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM;
			};

			this.getStandardInput = function() {
				return (stdio && stdio.input) ? stdio.input.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.INPUT_STREAM;
			};

			this.getSubprocessEnvironment = function() {
				var _hashMap = function(p) {
					var rv = new Packages.java.util.HashMap();
					for (var x in p) {
						if (p[x] === null) {
							//	do nothing
						} else {
							rv.put( new Packages.java.lang.String(x), new Packages.java.lang.String(p[x]) );
						}
					}
					return rv;
				}

				return _hashMap( (p.environment) ? p.environment : $exports.environment );
			};

			this.getWorkingDirectory = function() {
				return (directory) ? directory.pathname.java.adapt() : null;
			};
		}
	);

	var invocation = (function() {
		var rv = {
			configuration: {},
			result: {}
		};

		var toCommandToken = function(invocation) {
			var toErrorMessageString = function(v) {
				if (typeof(v) == "undefined") return "(undefined)";
				if (v === null) return "(null)";
				return String(v);
			};

			var toErrorMessage = function() {
				var full = [invocation.command];
				if (invocation.arguments) full = full.concat(invocation.arguments);
				return full.map(toErrorMessageString).join(" ");
			}

			return function(arg,index) {
				var index = (arguments.length > 1) ? arguments[1] : null;
				var label = (typeof(index) == "number") ? "property 'arguments[" + String(index) + "]'" : "property 'command'";
				if (typeof(arg) == "undefined") {
					throw new TypeError(label + " cannot be undefined; full invocation = " + toErrorMessage());
				}
				if (arg === null) throw new TypeError(label + " must not be null; full invocation = " + toErrorMessage());
				if (arg && typeof(arg) == "object") return String(arg);
				//	TODO	the below check does not allow the empty string to be a token
				if (arg && typeof(arg) == "string") return arg;
				throw new TypeError(label + " is not a string nor an object that can be converted to string.");
			};
		}

//		var toCommandToken = function(arg) {
//			var index = (arguments.length > 1) ? arguments[1] : null;
//			var label = (typeof(index) == "number") ? "token " + String(index) + " '" + arg + "'" : "command";
//			if (typeof(arg) == "undefined") {
//				throw new TypeError(label + " cannot be undefined.");
//			}
//			if (arg === null) throw new TypeError(label + " cannot be null.");
//			if (arg && typeof(arg) == "object") return String(arg);
//			//	TODO	the below check does not allow the empty string to be a token
//			if (arg && typeof(arg) == "string") return arg;
//			throw new TypeError(label + " is not a string nor an object that can be converted to string.");
//		}

		if (p.tokens) {
			return $api.deprecate(function() {
				//	TODO	ensure array
				if (p.tokens.length == 0) {
					throw new TypeError("tokens cannot be zero-length.");
				}
				//	Use a raw copy of the arguments for the callback
				rv.result.command = p.tokens[0];
				rv.result.arguments = p.tokens.slice(1);
				//	Convert the arguments to strings for invocation
				var configuration = p.tokens.map(toCommandToken(rv.result));
				rv.configuration.command = configuration[0];
				rv.configuration.arguments = configuration.slice(1);
				return rv;
			})();
		} else if (typeof(p.command) != "undefined") {
			rv.result.command = p.command;
			rv.result.arguments = p.arguments;
			rv.result.as = p.as;
			rv.configuration.command = toCommandToken(rv.result)(p.command);
			rv.configuration.arguments = (p.arguments) ? p.arguments.map(toCommandToken(rv.result)) : [];
			return rv;
		} else {
			throw new TypeError("Required: command property or tokens property");
		}
	})();

	if (as) {
		if ($exports.os.name == "Linux") {
			invocation.configuration.command = "sudo";
			invocation.configuration.arguments = ["-u", as.user].concat(invocation.configuration.arguments);
		}
	}

	var configuration = new JavaAdapter(
		Packages.inonit.system.Command.Configuration,
		new function() {
			var args = $context.api.java.Array.create({
				type: Packages.java.lang.String,
				array: invocation.configuration.arguments.map(function(s) {
					return new Packages.java.lang.String(s);
				})
			});
			this.getCommand = function() {
				return new Packages.java.lang.String(invocation.configuration.command);
			};

			this.getArguments = function() {
				return args;
			};
		}
	);
	var result = {
		command: invocation.result.command,
		arguments: invocation.result.arguments
	};
	if (p.environment) {
		result.environment = p.environment;
	}
	if (directory) {
		if (typeof(directory) != "undefined") {
			result.directory = directory;
			result.workingDirectory = directory;
			$api.deprecate(result,"workingDirectory");
		}
	}

	if (p.on && p.on.start) {
		//	TODO	could throw exception on launch; should deal with it
		var _subprocess = Packages.inonit.system.OperatingSystem.get().start(context, configuration);
		p.on.start.call({}, new function() {
			Object.defineProperty(this, "pid", {
				get: function() {
					return _subprocess.getPid();
				},
				enumerable: true
			});

			this.kill = function() {
				_subprocess.terminate();
			}
		});
		var listener = new function() {
			this.finished = function(status) {
				this.status = status;
			};

			this.interrupted = function(_exception) {
				//	who knows what we should do here. Kill the process?
				throw new Error("Unhandled Java thread interruption.");
			};
		};
		_subprocess.wait(new JavaAdapter(
			Packages.inonit.system.Subprocess.Listener,
			listener
		));
		result.status = listener.status;
	} else {
		var _listener = Packages.inonit.system.OperatingSystem.get().run( context, configuration );
		if (_listener.getLaunchException()) {
			result.error = _listener.getLaunchException();
		} else {
			result.status = Number( _listener.getExitStatus().intValue() );
		}
	}
	stdio.close();
	//	TODO	this returning of stdio values is currently undocumented. Certainly they should be returned if String were specified
	//			as their type; not sure what should happen otherwise.
	["output","error"].forEach(function(stream) {
		if (typeof(stdio[stream]) == "string") {
			if (!result.stdio) result.stdio = {};
			result.stdio[stream] = stdio[stream];
		}
	});
	var evaluate = (p.evaluate) ? p.evaluate : arguments.callee.evaluate;
	return evaluate(result);
};
$exports.run.evaluate = function(result) {
	if (result.error) throw result.error;
	if (result.status != 0) throw new Error("Exit code: " + result.status + " executing " + result.command + ((result.arguments && result.arguments.length) ? " " + result.arguments.join(" ") : ""));
	return result;
};
$exports.run.stdio = (function(p) {
	var rv = (function() {
		if (typeof(p.stdio) != "undefined") return p.stdio;

		if (typeof(p.stdin) != "undefined" || typeof(p.stdout) != "undefined" || typeof(p.stderr) != "undefined") {
			return $api.deprecate(function() {
				return {
					input: p.stdin,
					output: p.stdout,
					error: p.stderr
				};
			})();
		}

		return {};
	})();
	if (rv) {
		var buffers = {};
		rv.close = function() {
			for (var x in buffers) {
				buffers[x].close();
				if (buffers[x].readText) {
					this[x] = buffers[x].readText().asString();
				}
			}
		};
		["output","error"].forEach(function(stream) {
			if (rv[stream] == String) {
				buffers[stream] = new $context.api.io.Buffer();
				rv[stream] = buffers[stream].writeBinary();
			} else if (rv[stream] && typeof(rv[stream]) == "object" && rv[stream].line) {
				buffers[stream] = new (function(callback) {
					var buffer = new $context.api.io.Buffer();

					var thread = $context.api.java.Thread.start({
						call: function() {
							buffer.readText().readLines(callback);
						}
					});

					this.buffer = buffer;

					this.close = function() {
						buffer.close();
						thread.join();
					}
				})(rv[stream].line);
				rv[stream] = buffers[stream].buffer.writeBinary();
			}
		});
		if (typeof(rv.input) == "string") {
			var buffer = new $context.api.io.Buffer();
			buffer.writeText().write(rv.input);
			buffer.close();
			rv.input = buffer.readBinary();
		}
	}
	if (rv) {
		if ($exports.stdio) {
			["output","error"].forEach(function(stream) {
				if (typeof(rv[stream]) == "undefined") rv[stream] = $exports.stdio[stream];
			});
		}
		if (typeof(rv.input) == "undefined") rv.input = null;
	} else {
		//	The only way rv should be anything other than an object is if p.stdio was null
		if (!$exports.stdio) {
			if (p.stdio === null) {
			} else {
				throw new Error("Unreachable");
			}
		}
	}
	return rv;
});
$exports.run.directory = function(p) {
	var getDirectoryProperty = function(p) {
		if (p.directory && p.directory.pathname) {
			return p.directory;
		}
	}

	if (p.directory) {
		return getDirectoryProperty(p);
	}
	if (p.workingDirectory) {
		return $api.deprecate(getDirectoryProperty)({ directory: p.workingDirectory });
	}
}
$exports.environment = $context.api.java.Environment( ($context._environment) ? $context._environment : Packages.inonit.system.OperatingSystem.Environment.SYSTEM );

var toLocalPathname = function(osPathname) {
	var _rv = osPathname.java.adapt();
	return $context.api.file.filesystem.java.adapt(_rv);
}

$exports.properties = new function() {
	var _properties = ($context._properties) ? $context._properties : Packages.java.lang.System.getProperties();

	this.object = $context.api.java.Properties.adapt( _properties );

	this.get = function(name) {
		var rv = _properties.getProperty(name);
		if (!rv) return null;
		return String(rv);
	};

	this.directory = function(name) {
		return toLocalPathname($context.api.file.filesystems.os.Pathname(this.get(name))).directory;
	};

	this.searchpath = function(name) {
		var string = this.get(name);
		if (!string) throw new Error("No property: " + name);
		var rv = $context.api.file.filesystems.os.Searchpath.parse(string);
		var pathnames = rv.pathnames.map(toLocalPathname);
		return $context.api.file.Searchpath(pathnames);
	};
};

var toLocalSearchpath = function(searchpath) {
	return $context.api.file.Searchpath($context.api.file.filesystems.os.Searchpath.parse(searchpath).pathnames.map(toLocalPathname));
};

$api.experimental($exports.properties,"object");

//	TODO	document
$exports.os = new function() {
	this.name = $exports.properties.get("os.name");
	this.arch = $exports.properties.get("os.arch");
	this.version = $exports.properties.get("os.version");
	this.newline = $exports.properties.get("line.separator");

	this.resolve = function(p) {
		if (typeof(p) == "function") {
			return p.call(this);
		} else if (typeof(p) == "object") {
			if (p[this.name]) return p[this.name];
			if (/^Windows/.test(this.name) && p.Windows) return p.Windows;
			if ( (this.name == "Linux" || this.name == "Mac OS X") && p.UNIX ) return p.UNIX;
		}
	}
};

$exports.TMPDIR = $exports.properties.directory("java.io.tmpdir");
$exports.USER = $exports.properties.get("user.name");
$exports.HOME = $exports.properties.directory("user.home");
if ($exports.properties.get("user.dir")) {
	$exports.PWD = $exports.properties.directory("user.dir");
}
if ($exports.environment.PATH) {
	$exports.PATH = toLocalSearchpath($exports.environment.PATH);
} else if ($exports.environment.Path) {
	//	Windows
	$exports.PATH = toLocalSearchpath($exports.environment.Path);
} else {
	$exports.PATH = $context.api.file.Searchpath([]);
}

$exports.user = {};
if ($exports.HOME.getSubdirectory("Downloads")) $exports.user.downloads = $exports.HOME.getSubdirectory("Downloads");
//	TODO	document that this is optional; that there are some environments where "working directory" makes little sense

$loader.run("os.js", {
	$context: {
		PATH: $exports.PATH,
		TMPDIR: $exports.TMPDIR,
		os: $exports.os,
		run: $exports.run,
		environment: $exports.environment,
		api: {
			js: $context.api.js,
			io: $context.api.io,
			file: $context.api.file
		}
	},
	$exports: $exports.os
});

Object.defineProperty(
	$exports,
	"browser",
	{
		get: $api.Function.singleton(function() {
			var rv = {};
			$loader.run("browsers.js", {
				$context: {
					os: $exports.os,
					HOME: $exports.HOME,
					TMPDIR: $exports.TMPDIR,
					run: $exports.run,
					api: {
						js: $context.api.js,
						java: $context.api.java,
						file: $context.api.file
					}
				},
				$exports: rv
			});
			return rv;
		})
	}
);

$exports.system = {};
Object.defineProperty(
	$exports.system,
	"apple",
	{
		get: $api.Function.singleton(function() {
			return $loader.file("apple.js", {
				api: {
					document: $context.api.document,
					js: $context.api.js,
					shell: $exports,
					xml: $context.api.xml
				}
			});
		})
	}
)

var addPropertyArgumentsTo = function(jargs,properties) {
	if (properties) {
		for (var x in properties) {
			jargs.push("-D" + x + "=" + properties[x]);
		}
	}
};

$exports.java = function(p) {
	//	TODO	check for both p.classpath and p.jar being defined and decide what to do
	var launcher = arguments.callee.launcher;
	var shell = {
		command: launcher
	};
	var args = [];
	var vmarguments = (p.vmarguments) ? p.vmarguments : [];
	if (p.properties) {
		addPropertyArgumentsTo(vmarguments,p.properties);
	}
	args.push.apply(args,vmarguments);
	for (var x in p) {
		if (x == "classpath") {
			args.push("-classpath", p[x]);
		} else if (x == "jar") {
			args.push("-jar", p[x]);
		} else if (x == "properties") {
		} else {
			shell[x] = p[x];
		}
	}
	//	TODO	some way of specifying VM arguments
	if (!p.jar) {
		args.push(p.main);
	}
	shell.arguments = args.concat( (p.arguments) ? p.arguments : [] );
	return $exports.run(shell);
};
(function() {
	this.version = $exports.properties.get("java.version");
	this.vendor = new function() {
		this.toString = function() {
			return $exports.properties.get("java.vendor");
		}

		this.url = $exports.properties.get("java.vendor.url");
	}
	this.home = $exports.properties.directory("java.home");

	var Vvn = function(prefix) {
		this.version = $exports.properties.get(prefix + "version");
		this.vendor = $exports.properties.get(prefix + "vendor");
		this.name = $exports.properties.get(prefix + "name");
	}

	this.vm = new Vvn("java.vm.");
	this.vm.specification = new Vvn("java.vm.specification.");
	this.specification = new Vvn("java.specification.");

	this["class"] = new function() {
		this.version = $exports.properties.get("java.class.version");
		this.path = $exports.properties.searchpath("java.class.path");
	}

	//	Convenience alias that omits keyword
	this.CLASSPATH = this["class"].path;

	this.library = new function() {
		this.path = $exports.properties.searchpath("java.library.path");
	}

	//	java.io.tmpdir really part of filesystem; see TMPDIR above

	//	Javadoc claims this to be always present but it is sometimes null; we leave it as undefined in that case, although this
	//	behavior is undocumented
	var compiler = $exports.properties.get("java.compiler");
	if (compiler) {
		this.compiler = compiler;
	}

	this.ext = new function() {
		this.dirs = $exports.properties.searchpath("java.ext.dirs");
	}

	//	os.name, os.arch, os.version handled by $exports.os

	//	file.separator, path.separator, line.separator handled by filesystems in jsh.file

	//	user.name is $exports.USER
	//	user.home is $exports.HOME
	//	user.dir is $exports.PWD

	//	TODO	Document
	this.launcher = $context.api.file.Searchpath([this.home.getRelativePath("bin")]).getCommand("java");

	this.jrunscript = $context.api.file.Searchpath([this.home.getRelativePath("bin"),this.home.getRelativePath("../bin")]).getCommand("jrunscript");
}).call($exports.java);

$exports.jrunscript = function(p) {
	var launch = (function() {
		if (false && $exports.rhino && $exports.rhino.classpath) {
			//	TODO	implicit jsh dependency, because rhino.classpath not set in this file
			return {
				command: $exports.java.launcher,
				arguments: [
					"-jar", $exports.rhino.classpath.pathnames[0],
					"-opt", "-1"
				],
				vmArgumentPrefix: ""
			};
		} else {
			if (!$exports.java.jrunscript) {
				var searchpath = $context.api.file.Searchpath([$exports.java.home.getRelativePath("bin"),$exports.java.home.getRelativePath("../bin")]);
				Packages.java.lang.System.err.println("path = " + searchpath);
				Packages.java.lang.System.err.println("path = " + searchpath.getCommand("jrunscript"));
				throw new Error("No jrunscript in " + $exports.java.home);
			}
			return {
				command: $exports.java.jrunscript,
				arguments: [],
				vmArgumentPrefix: "-J"
			}
		}
	})();

	var vmargs = [];

	addPropertyArgumentsTo(vmargs,p.properties);

	if (p.vmarguments) {
		for (var i=0; i<p.vmarguments.length; i++) {
			vmargs.push(launch.vmArgumentPrefix + p.vmarguments[i]);
		}
	}

	var args = vmargs.concat(launch.arguments).concat(p.arguments);

	return $exports.run($context.api.js.Object.set({}, p, {
		command: launch.command,
		arguments: args
	}));
}