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

//	These methods are included in the Rhino shell but not in the Nashorn shell. We define them here. This incompatibility was
//	reported on the nashorn-dev mailing list in the thread "Rhino shell compatibility"
//	(see http://mail.openjdk.java.net/pipermail/nashorn-dev/2014-May/002967.html) and the decision was not to plug the
//	compatibility holes.

if (!this.readFile) this.readFile = function(path) {
	var rv = "";
	var reader = new Packages.java.io.FileReader(path);
	var c;
	while((c = reader.read()) != -1) {
		var _character = new Packages.java.lang.Character(c);
		rv += _character.toString();
	}
	return rv;
};
if (!this.readUrl) this.readUrl = function(path) {
	var rv = "";
	var connection = new Packages.java.net.URL(path).openConnection();
	var reader = new Packages.java.io.InputStreamReader(connection.getInputStream());
	var c;
	while((c = reader.read()) != -1) {
		var _character = new Packages.java.lang.Character(c);
		rv += _character.toString();
	}
	return rv;
};

//	TODO	much of this is redundant with inonit.system.Command, but we preserve it here because we are trying to remain
//			dependent only on Rhino, which apparently has a bug(?) making its own runCommand() not work correctly in this
//			scenario when an InputStream is provided: even when underlying process terminates, command does not return
//	TODO	this has the potential to run really slowly when written in JavaScript
this.runCommand = function() {
	var Buffer = function(initial) {
		var _bytes = new Packages.java.io.ByteArrayOutputStream();

		var string = initial;

		this.stream = _bytes;

		this.finish = function() {
			_bytes.close();
			var _reader = new Packages.java.io.InputStreamReader(new Packages.java.io.ByteArrayInputStream(_bytes.toByteArray()));
			var c;
			while((c = _reader.read()) != -1) {
				string += new Packages.java.lang.Character(c).toString();
			}
			return string;
		}
	}

	var buffers = {};
	var context = new function() {
		var mode;

		this.setMode = function(value) {
			mode = value;
			if (typeof(mode.output) == "string") {
				buffers.output = new Buffer(mode.output);
			}
			if (typeof(mode.err) == "string") {
				buffers.err = new Buffer(mode.err);
			}
		}

		this.environment = function(_environment) {
			if (mode && mode.env) {
				_environment.clear();
				for (var x in mode.env) {
					if (mode.env[x]) {
						_environment.put(new Packages.java.lang.String(x), new Packages.java.lang.String(mode.env[x]));
					}
				}
			} else {
			}
		}

		this.getStandardOutput = function() {
			if (buffers.output) return buffers.output.stream;
			if (mode && mode.output) return mode.output;
			return Packages.java.lang.System.out;
		};
		this.getStandardError = function() {
			if (buffers.err) return buffers.err.stream;
			if (mode && mode.err) return mode.err;
			return Packages.java.lang.System.err;
		};
		this.getStandardInput = function() {
			if (mode && mode.input) return mode.input;
			return new Packages.java.io.ByteArrayInputStream(Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE,0));
			//	The below construct is apparently not compatible with pre-Java 8 jrunscript
//			return new JavaAdapter(
//				Packages.java.io.InputStream,
//				new function() {
//					this.read = function() {
//						return -1;
//					}
//				}
//			);
		};

		this.finish = function() {
			if (buffers.output) mode.output = buffers.output.finish();
			if (buffers.err) mode.err = buffers.err.finish();
		}
	}
	var list = new Packages.java.util.ArrayList();
	for (var i=0; i<arguments.length; i++) {
		if (typeof(arguments[i]) == "string") {
			list.add(new Packages.java.lang.String(arguments[i]));
		} else if (i < arguments.length-1) {
			list.add(new Packages.java.lang.String(String(arguments[i])));
		} else {
			//	TODO	in Rhino-compatible runCommand this should only work if it is the last argument
			context.setMode(arguments[i]);
		}
	}
	var _builder = new Packages.java.lang.ProcessBuilder(list);
	context.environment(_builder.environment());
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
	var _out = Spooler.start(_stdin, delegate.getOutputStream(), true, "stdin from " + _stdin + ": " + spoolName);
	var rv = delegate.waitFor();
	_in.join();
	_err.join();
	context.finish();
	return rv;
};

var Class_java_lang_String;
//	TODO	the below currently does not work when running inside the JSR223 Rhino engine bundled with Java 6 and Java 7; it falsely
//			detects as Nashorn
var NASHORN_AVAILABLE = new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn");
var RHINO_UNAVAILABLE = typeof(Packages.org.mozilla.javascript.Context) == "object";
var RHINO_NOT_RUNNING = RHINO_UNAVAILABLE || Packages.org.mozilla.javascript.Context.getCurrentContext() == null;
if (NASHORN_AVAILABLE && RHINO_NOT_RUNNING) {
	load("nashorn:mozilla_compat.js");
	Class_java_lang_String = Packages.java.lang.String.class;
} else {
	Class_java_lang_String = Packages.java.lang.String;
}

var debug = function(message) {
	if (arguments.callee.on) Packages.java.lang.System.err.println(message);
}

var console = function(message) {
	Packages.java.lang.System.err.println(message);
}

var slash = String(Packages.java.io.File.separator);
var colon = String(Packages.java.io.File.pathSeparator);

var env = (function() {
	var caseInsensitive = (Packages.java.lang.System.getenv("path") == Packages.java.lang.System.getenv("PATH"));
	var rv = {};

	//	This formulation requires JDK 1.5+; would need different mechanism for JDK 1.4 and lower
	var map = Packages.java.lang.System.getenv();
	var entries = map.entrySet().iterator();
	while(entries.hasNext()) {
		var entry = entries.next();
		var name = String(entry.getKey());
		if (caseInsensitive) name = name.toUpperCase();
		rv[name] = String(entry.getValue());
	}
	return rv;
})();

var getSystemProperty = function(name) {
	if (Packages.java.lang.System.getProperty(name)) {
		return String(Packages.java.lang.System.getProperty(name));
	}
}

var JAVA_HOME = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));

var platform = new function() {
	var uname = function() {
		try {
			var mode = { output: "" };
			var status = runCommand("uname", mode);
			if (!status) {
				return mode.output.substring(0,mode.output.length-1);
			}
		} catch (e) {
			return function(){}();
		}
	}();
	debug("uname = [" + uname + "]");

	if (uname) {
		this.unix = {
			uname: uname
		}

		if (uname.substring(0,6) == "CYGWIN") {
			//	TODO	Hardcoded file locations, among other problems
			//	reg query "HKLM\Software\Cygnus Solutions\Cygwin\mounts v2\/"
			this.cygwin = new function() {
				this.realpath = function(unix) {
					option = { output: "" };
					runCommand("c:/cygwin/bin/realpath.exe",unix,option);
					return option.output.substring(0,option.output.length-1);
				}

				this.cygpath = new function() {
					this.windows = function(unix,mode) {
						if (!mode) mode = {};
						var m = (mode.path) ? "-wp" : "-w";
						var option = {output: ""};
						var exit = runCommand("c:/cygwin/bin/cygpath.exe", m, unix, option);
						if (exit) {
							throw new Error("Error running cygpath: " + m + " " + unix);
						}
						return option.output.substring(0,option.output.length-1);
					}

					this.unix = function(windows,mode) {
						if (!mode) mode = {};
						var m = (mode.path) ? "-up" : "-u";
						var option = {output: ""};
						var exit = runCommand("c:/cygwin/bin/cygpath.exe", m, windows, option);
						if (exit) {
							throw new Error("Error running cygpath: " + m + " " + windows);
						}
						return option.output.substring(0,option.output.length-1);
					}
				}
			}
		}
	}
};
platform.io = {};
platform.io.write = function(to,writerFunction) {
	var writer = new Packages.java.io.PrintWriter(new Packages.java.io.FileWriter(to));
	writerFunction(writer);
	writer.close();
}
platform.io.copyStream = function(i,o) {
	var r;
	while( (r = i.read()) != -1 ) {
		o.write(r);
	}
};
platform.io.copyFile = function copyFile(from,to,filters) {
	if (!filters) filters = [];
	for (var i=0; i<filters.length; i++) {
		if (filters[i].accept(from)) {
			filters[i].process(from,to);
			return;
		}
	}
	if (from.isDirectory()) {
		to.mkdir();
		var files = from.listFiles();
		for (var i=0; i<files.length; i++) {
			copyFile(files[i], new File(to,files[i].getName()));
		}
	} else if (from.exists()) {
		var i = new Packages.java.io.BufferedInputStream(new Packages.java.io.FileInputStream(from));
		var o = new Packages.java.io.BufferedOutputStream(new Packages.java.io.FileOutputStream(to));
		platform.io.copyStream(i,o);
		o.close();
		i.close();
	} else {
		throw new Error("Unimplemented: copying " + from.getCanonicalPath());
	}
};
platform.io.createTemporaryDirectory = function() {
	var tmpfile;
	for (var i=0; i<20; i++) {
		try {
			tmpfile = Packages.java.io.File.createTempFile("jsh",null);
		} catch (e) {
			Packages.java.lang.System.err.println("Warning: " + String(i+1) + " failures creating temp file in " + Packages.java.lang.System.getProperty("java.io.tmpdir"));
		}
	}
	if (tmpfile) {
		tmpfile["delete"]();
		tmpfile.mkdirs();
		return tmpfile;
	} else {
		throw "Could not create temporary file.";
	}
};

platform.jdk = {};
(function() {
	var tried = false;
	var compiler;

	platform.jdk.__defineGetter__("compile", function() {
		if (!tried) {
			Packages.java.lang.System.err.println("Loading Java compiler ...");
			compiler = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
			tried = true;
		}
		if (compiler) {
			return function(args) {
				debug("Compiling with: " + args);
				var jarray = Packages.java.lang.reflect.Array.newInstance(Class_java_lang_String,args.length);
				for (var i=0; i<jarray.length; i++) {
					jarray[i] = new Packages.java.lang.String(args[i]);
				}
				var status = compiler.run(
					Packages.java.lang.System["in"],
					Packages.java.lang.System.out,
					Packages.java.lang.System.err,
					jarray
				);
				if (status) {
					throw new Error("Compiler exited with status " + status + " with inputs " + args.join(","));
				}
			}
		}
	});
})();
