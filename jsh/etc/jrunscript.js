//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var $engine = (function(global) {
	var Nashorn = function() {
		this.filename = new Packages.java.lang.Throwable().getStackTrace()[0].getFileName();
	};

	var Rhino = function() {
		this.filename = global["javax.script.filename"];
	}

	var engines = {
		nashorn: new Nashorn(),
		jdkrhino: new Rhino()
	};

	var name = (function() {
		if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
			return "nashorn";
		} else {
			return "jdkrhino";
		}
	})();

	var rv = engines[name];
	rv.resolve = function(options) {
		return options[name];
	};
	return rv;
})(this);

var $java = new function() {
	var jdk = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));
	var launcher = (function() {
		if (new File(jdk, "bin/java").exists()) return new File(jdk, "bin/java");
		if (new File(jdk, "bin/java.exe").exists()) return new File(jdk, "bin/java.exe");
	})();

	this.home = jdk;
	this.launcher = launcher;
};

var $api = {};
$api.shell = {};

(function() {
	var interpret = function(string) {
		if (new Packages.java.io.File(string).exists()) {
			var file = new Packages.java.io.File(string);
			return {
				file: file
			};
		} else {
			var url = new Packages.java.net.URL(string);
			return {
				url: url
			};
		}
	};

	$api.Script = function(p) {
		var Callee = arguments.callee;
		if (p.string) {
			return new arguments.callee(interpret(p.string));
		}
		if (p.file) {
			this.toString = function() { return String(p.file.getCanonicalPath()); }
			this.file = p.file;
			this.resolve = function(path) {
				if (new Packages.java.io.File(path).isAbsolute()) {
					return new Callee({ file: new Packages.java.io.File(path) });
				}
				return new Callee({ file: new Packages.java.io.File(p.file.getParentFile(), path) });
			};
		} else if (p.url) {
			this.toString = function() { return String(p.url.toExternalForm()); }
			this.url = p.url;
			this.resolve = function(path) {
				return new Callee({ url: new Packages.java.net.URL(p.url, path) });
			};
		}
		
		this.load = function() {
			load(this.toString());
		}
	};
	
	$api.script = new $api.Script({
		string: $engine.filename
	});
})();

$api.shell.rhino = function(p) {
	//	p:
	//		rhino (Packages.java.io.File): Rhino js.jar
	//		script (Packages.java.io.File): main script to run
	//		arguments (Array): arguments to send to script
	//		directory (optional Packages.java.io.File): working directory in which to run it
	var dashD = [];
	if (p.properties) {
		for (var x in p.properties) {
			dashD.push("-D" + x + "=" + p.properties[x]);
		}
	}
	var command = [
		$java.launcher.getCanonicalPath()
	]
	.concat(dashD)
	.concat([
		"-jar",p.rhino.getCanonicalPath(),
		"-opt","-1",
		p.script.getCanonicalPath()
	]).concat((p.arguments) ? p.arguments : []);

	var USE_JRUNSCRIPT_EXEC = false;
	if (USE_JRUNSCRIPT_EXEC) {
		//	The jrunscript built-in exec() requires a single argument, which causes a mess here; we don't want to
		//	double-quote "Program Files" on Windows, etc., so we will just use "real" Java
//						exec(command.join(" "));
		throw new Error("Unimplemented: jrunscript exec()");
	} else {
		var _command = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.String,command.length);
		for (var i=0; i<command.length; i++) {
			_command[i] = command[i];;
		}
		var _builder = new Packages.java.lang.ProcessBuilder(_command);
		var USE_JAVA_1_7 = false;
		if (USE_JAVA_1_7) {
			var Redirect = Packages.java.lang.ProcessBuilder.Redirect;
			_builder.redirectOutput(Redirect.INHERIT).redirectError(Redirect.INHERIT);
		}
		if (p.directory) _builder.directory(p.directory);

		var _process = _builder.start();

		if (!USE_JAVA_1_7) {
			var spool = function(from,to) {
				var t = new Packages.java.lang.Thread(function() {
					var b;
					while( (b = from.read()) != -1 ) {
						to.write(b);
					}
					from.close();
					to.close();
				});
				t.start();
				return t;
			};

			var out = spool(_process.getInputStream(), Packages.java.lang.System.out);
			var err = spool(_process.getErrorStream(), Packages.java.lang.System.err);
		}

		//	TODO	error handling
		var exitStatus = _process.waitFor();
		out.join();
		err.join();
		return exitStatus;
	}
};

var $arguments = (function() {
	var rv = [];
	for (var i=0; i<this["javax.script.argv"].length; i++) {
		rv[i] = String(this["javax.script.argv"][i]);
	}
	return rv;
})();

var $script;

if ($api.script.url && $api.script.url.getQuery()) {
	var parameters = (function() {
		//	Only allows single value for each name; surely sufficient for this purpose
		var rv = {};
		var string = String($api.script.url.getQuery());
		string.split("&").forEach(function(pair) {
			var tokens = pair.split("=");
			rv[tokens[0]] = tokens[1];
		});
		return rv;
	})();
	if (parameters.relative) {
		$script = $api.script.resolve(parameters.relative);
		$script.load();
	} else {
		Packages.java.lang.System.err.println("Usage: jrunscript.js <script> [arguments]");
		Packages.java.lang.System.exit(1);			
	}
} else if ($arguments.length) {
	$script = new $api.Script({ string: $arguments.shift() });
	$script.load();
} else {
	Packages.java.lang.System.err.println("Usage: jrunscript.js <script> [arguments]");
	Packages.java.lang.System.exit(1);	
}
