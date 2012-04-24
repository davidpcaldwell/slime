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

$exports.exit = $context.exit;
$exports.environment = $context.api.shell.environment;
$exports.properties = $context.api.shell.properties;
$api.experimental($exports,"properties");

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
		console = streamToConsole(mode.stream,arguments.callee.toString);
	} else {
		console = streamToConsole($context.api.io.Streams.stdout,arguments.callee.toString);
	}

	console(message);
}
$exports.echo.toString = function(message) {
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
$exports.echo.toString["undefined"] = "(undefined)";
$exports.echo.toString["null"] = "(null)";

$exports.shell = function(command,args,mode) {
	if (arguments.length < 3) {
		mode = {};
	}

	var Streams = $context.api.io.Streams;
	var isJavaType = $context.api.java.isJavaType;
	var $run = $context.api.shell.run;
	var $filesystems = $context.api.file.filesystems;

	//	If the command is given as a Pathname object, convert it to a host file name for execution.
	if ($filesystems.cygwin) {
		command = $filesystems.cygwin.toWindows( command );
	}

	var preprocessor = function(item) { return item; }
	if ($filesystems.cygwin && mode.filesystem == $filesystems.os) {
		preprocessor = $filesystems.cygwin.toWindows;
	} else if ($filesystems.cygwin && mode.filesystem == $filesystems.cygwin) {
		preprocessor = $filesystems.cygwin.toUnix;
	}
	args = args.map( preprocessor );

	var tokens = [ command ].concat( args );

	var rMode = new function() {
		var stream = function(x) {
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
			throw "Unknown working directory: " + work;
		})();

		this.onExit = mode.onExit;

		this.stdin = stream("stdin");
		this.stdout = stream("stdout");
		this.stderr = stream("stderr");
	};

	$run(tokens,rMode);
}

var getProperty = function(name) {
	var value = eval("$context.api.shell.properties." + name);
	if (String(value) == "undefined") return function(){}();
	if (value == null) return null;
	return String(value);
}

var getDirectoryProperty = function(name) {
	var rv = $context.api.file.filesystems.os.Pathname($context.getSystemProperty(name)).directory;
	//	TODO	find more robust way to do this
	if ($context.api.file.filesystems.cygwin) {
		rv = $context.api.file.filesystems.cygwin.toUnix(rv.pathname).directory;
	}
	return rv;
}

$exports.java = new function() {
	var jdk = getDirectoryProperty("java.home");

	//	TODO	find more robust way to do this
	if ($context.api.file.filesystems.cygwin) {
		jdk = $context.api.file.filesystems.cygwin.toUnix(jdk.pathname).directory;
	}

	this.home = jdk;
}

$exports.TMP = getDirectoryProperty("java.io.tmpdir");
$exports.HOME = getDirectoryProperty("user.home");

$exports.jsh = function(script,args,mode) {
	if (!mode) mode = {};
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

	if (!mode.environment) mode.environment = {};
	for (var x in $context.api.shell.properties.jsh.launcher.environment) {
		if (x != "JSH_RHINO_DEBUGGER" && x != "JSH_LAUNCHER_DEBUG") {
			if (typeof(mode.environment[x]) == "undefined") {
				mode.environment[x] = String($context.api.shell.properties.jsh.launcher.environment[x]);
			}
		}
	}
	for (var x in $context.api.shell.environment) {
		if (x != "JSH_RHINO_DEBUGGER" && x != "JSH_LAUNCHER_DEBUG") {
			if (typeof(mode.environment[x]) == "undefined") {
				mode.environment[x] = $context.api.shell.environment[x];
			}
		}
	}

	$exports.shell(executable,jargs,mode);
}