//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

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

$api.debug = function(message) {
	if (arguments.callee.on) Packages.java.lang.System.err.println(message);
};

$api.console = function(message) {
	Packages.java.lang.System.err.println(message);
}

var slime = new function() {
	this.src = new function() {
		this.toString = function() {
			return $api.script.resolve("../../../..").toString();
		};

		this.getPath = function(path) {
			return $api.script.resolve("../../../../" + path).toString();
		}

		this.getFile = function(path) {
			return $api.script.resolve("../../../../" + path).file;
		}

		this.getSourceFilesUnder = function getSourceFilesUnder(dir,rv) {
			if (typeof(rv) == "undefined") {
				rv = [];
			}
			var files = dir.listFiles();
			if (!files) return [];
			for (var i=0; i<files.length; i++) {
				if (files[i].isDirectory() && String(files[i].getName()) != ".hg") {
					getSourceFilesUnder(files[i],rv);
				} else {
					if (files[i].getName().endsWith(".java")) {
						rv.push(files[i]);
					}
				}
			}
			return rv;
		};
	};

	var platform = new function() {
		this.jdk = new function() {
			var tried = false;
			var compiler;

			this.compile = (function(array) {
				if (!tried) {
					Packages.java.lang.System.err.println("Loading Java compiler ...");
					compiler = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
					tried = true;
				}
				if (compiler) {
					return function(args) {
						$api.debug("Compiling with: " + args);
						var jarray = Packages.java.lang.reflect.Array.newInstance($api.java.getClass("java.lang.String"),args.length);
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
			})();
		}
	};

	$api.jdk = platform.jdk;

	$api.platform = platform;

	this.launcher = new function() {
		this.compile = function(to) {
			platform.jdk.compile([
				"-d", LAUNCHER_CLASSES,
				"-sourcepath", slime.src.getPath("rhino/system/java") + Packages.java.io.File.pathSeparator + slime.src.getPath("jsh/launcher/rhino/java"),
				slime.src.getPath("jsh/launcher/rhino/java/inonit/script/jsh/launcher/Main.java")
			]);
		}
	}
};