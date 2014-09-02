//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	This script wraps commands to be executed directly from a SLIME source distribution
//
//	It places the following variables in the scope:
//	SLIME_SRC	A Packages.java.io.File representing the SLIME source root

var SLIME_SRC;

if (Packages.java.lang.System.getProperties().get("jsh.build.src")) {
	SLIME_SRC = Packages.java.lang.System.getProperties().get("jsh.build.src");
};

if (Packages.java.lang.System.getProperties().get("jsh.build.arguments")) {
	arguments = Packages.java.lang.System.getProperties().get("jsh.build.arguments");
}

if (!SLIME_SRC) SLIME_SRC = (function() {
	var thisfile;
	if (typeof(Packages.org.mozilla.javascript.WrappedException) == "function") {
		//	TODO	could this fail under certain kinds of optimization?
		var frames;
		try {
			throw new Packages.org.mozilla.javascript.WrappedException(Packages.java.lang.RuntimeException());
		} catch (e) {
//			debugger;
			var error = e;
			frames = error.getScriptStack();
		}
		//	Packages.java.lang.System.err.println("stack trace length: " + frames.length);
		for (var i=0; i<frames.length; i++) {
			//	Packages.java.lang.System.err.println("stack trace: " + frames[i].fileName);
			thisfile = String(frames[i].fileName);
		}
	} else {
		thisfile = new Packages.java.lang.Throwable().getStackTrace()[0].getFileName();
	}
	if (thisfile && /unbuilt\.rhino\.js/.test(thisfile)) {
		return new Packages.java.io.File(thisfile).getCanonicalFile().getParentFile().getParentFile().getParentFile();
	}
	//	TODO	below is included defensively in case some optimizations cause the above to fail
	//	TODO	probably would not work for Cygwin; see below logic from earlier version
//	if (platform.cygwin) {
//		_base = new Packages.java.io.File(platform.cygwin.cygpath.windows(String(env.JSH_SLIME_SRC)));
//	} else {
//		_base = new Packages.java.io.File(String(env.JSH_SLIME_SRC));
//	}
	if (Packages.java.lang.System.getenv("SLIME_SRC")) return new Packages.java.io.File(Packages.java.lang.System.getenv("SLIME_SRC"));
	Packages.java.lang.System.err.println("Could not determine SLIME source location. Probable solutions:");
	Packages.java.lang.System.err.println("* Run Rhino in interpreted mode (try -opt -1 on the command line)");
	Packages.java.lang.System.err.println("* Define the SLIME_SRC environment variable to point to the SLIME source directory.");
	Packages.java.lang.System.exit(1);
})();

Packages.java.lang.System.out.println("SLIME_SRC = " + SLIME_SRC.getCanonicalPath());

var load = (function(before) {
	return function(path) {
		before.call(this,String(path));
	}
})(load);

load(new Packages.java.io.File(SLIME_SRC,"jsh/launcher/rhino/api.rhino.js"));

//	These methods are included in the Rhino shell but not in the Nashorn shell. We define them here. This incompatibility was
//	reported on the nashorn-dev mailing list in the thread "Rhino shell compatibility" 
//	(see http://mail.openjdk.java.net/pipermail/nashorn-dev/2014-May/002967.html) and the decision was not to plug the
//	compatibility holes.
//	TODO	ideally would not redefine these if they are already defined
var readFile = function(path) {
	var rv = "";
	var reader = new Packages.java.io.FileReader(path);
	var c;
	while((c = reader.read()) != -1) {
		var _character = new Packages.java.lang.Character(c);
		rv += _character.toString();
	}
	return rv;
};
var readUrl = function(path) {
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
var runCommand = function() {
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
			return new JavaAdapter(
				Packages.java.io.InputStream,
				new function() {
					this.read = function() {
						return -1;
					}
				}
			);
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

if (arguments[0] == "build") {
	arguments.splice(0,1);
	load(new Packages.java.io.File(SLIME_SRC, "jsh/etc/build.rhino.js"));
} else if (arguments[0] == "launch") {
	arguments.splice(0,1);
	load(new Packages.java.io.File(SLIME_SRC, "jsh/launcher/rhino/test/unbuilt.rhino.js"));
} else if (arguments[0] == "develop") {
	arguments.splice(0,1,String(new Packages.java.io.File(SLIME_SRC, "jsh/etc/develop.jsh.js")));
	load(new Packages.java.io.File(SLIME_SRC, "jsh/launcher/rhino/test/unbuilt.rhino.js"));
} else if (arguments[0] == "verify") {
	var verifyArgs = arguments.slice(1);
	arguments.splice(0,arguments.length);
	var JSH_HOME = Packages.java.io.File.createTempFile("jsh-unbuilt.", ".tmp");
	JSH_HOME.mkdirs();
	arguments.push(JSH_HOME);
	Packages.java.lang.System.setProperty("jsh.build.notest","true");
	Packages.java.lang.System.setProperty("jsh.build.nodoc","true");
	//	TODO	set jsh.build.rhino to a java.io.File if it is needed here so that build builds it
	load(new Packages.java.io.File(SLIME_SRC, "jsh/etc/build.rhino.js"));
	var JAVA_HOME = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));
	var command = [];
	command.push(String(new Packages.java.io.File(JAVA_HOME,"bin/java")),"-jar",String(new File(JSH_HOME,"jsh.jar")));
	command.push(String(new Packages.java.io.File(SLIME_SRC, "jsh/test/verify.jsh.js")),"-slime",String(SLIME_SRC));
	command = command.concat(verifyArgs);
	if (Packages.java.lang.System.getProperty("jsh.build.tomcat.home")) {
		command.push("-tomcat",String(new Packages.java.io.File(Packages.java.lang.System.getProperty("jsh.build.tomcat.home"))));
	}
	Packages.java.lang.System.err.println("Verifying with command: " + command.join(" "));
	var status = runCommand.apply(this,command);
	if (status) {
		throw new Error("Verification failed with status: " + status);
	}
//	load(new Packages.java.io.File(SLIME_SRC, "jsh/launcher/rhino/test/unbuilt.rhino.js"));
} else if (arguments[0] == "test") {
	arguments.splice(0,1);
	//	create temporary file
	var JSH_HOME = Packages.java.io.File.createTempFile("jsh-unbuilt.", ".tmp");
	JSH_HOME.mkdirs();
	arguments.push(JSH_HOME.getCanonicalPath());
	Packages.java.lang.System.setProperty("jsh.build.nounit", "true");
	load(new Packages.java.io.File(SLIME_SRC, "jsh/etc/build.rhino.js"));
//	load(new Packages.java.io.File(SLIME_SRC, "jsh/test/suite.rhino.js"));
} else {
	Packages.java.lang.System.err.println("Usage:");
	Packages.java.lang.System.err.println("unbuilt.rhino.js build <arguments>");
	Packages.java.lang.System.err.println("unbuilt.rhino.js launch <arguments>");
	Packages.java.lang.System.exit(1);
}

if (false) {
	Packages.java.lang.System.out.println("arguments = " + arguments);
}