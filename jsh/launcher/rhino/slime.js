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

//	Provide better implementation that uses Java delegate, replacing pure JavaScript version supplied by api.js
$api.io.copy = function(i,o) {
	if (!arguments.callee.delegate) {
		arguments.callee.delegate = new Packages.inonit.script.runtime.io.Streams();
	}
	arguments.callee.delegate.copy(i,o);
};

$api.debug = function(message) {
	if (arguments.callee.on) Packages.java.lang.System.err.println(message);
};

$api.console = function(message) {
	Packages.java.lang.System.err.println(message);
}

$api.jdk = new function() {
	var tried = false;
	var compiler;

	this.compile = (function(array) {
		if (!tried) {
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
};

$api.slime = (function(was) {
	if (was && was.built) {
		was.launcher = new function() {
			this.getClasses = function() {
				return new Packages.java.io.File($api.script.file.getParentFile(), "jsh.jar");
			};
		}
		return was;
	} else {
		var rv = {};

		rv.src = new function() {
			var script = $api.script;

			this.toString = function() {
				return script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile().getParentFile().toString();
			};

//			$api.debug("rv.src = " + this);

			this.getPath = function(path) {
				$api.debug("getPath: " + path);
				return script.resolve("../../../" + path).toString();
			}

			this.getFile = function(path) {
				return script.resolve("../../../" + path).file;
			}

			this.File = function(path) {
				$api.debug("File: " + path);
				return new Packages.java.io.File(script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile(), path);
			}

			this.getSourceFilesUnder = function getSourceFilesUnder(dir,rv) {
				$api.debug("Under: " + dir);
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

		rv.launcher = new function() {
			this.compile = function(p) {
				var to = (p && p.to) ? p.to : $api.io.tmpdir();
				$api.jdk.compile([
					"-Xlint:deprecation",
					"-Xlint:unchecked",
					"-d", to,
					"-sourcepath", rv.src.getPath("rhino/system/java") + Packages.java.io.File.pathSeparator + rv.src.getPath("jsh/launcher/rhino/java"),
					rv.src.getPath("jsh/launcher/rhino/java/inonit/script/jsh/launcher/Main.java")
				]);
				if (!p || !p.to) return to;
			};

			this.getClasses = function() {
				return this.compile();
			}
		}

		return rv;
	}
})($api.slime);