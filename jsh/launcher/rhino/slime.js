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

$api.log = function(message) {
	Packages.java.util.logging.Logger.getLogger("inonit.jrunscript").log(Packages.java.util.logging.Level.INFO, message);
}

if (Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath")) {
	//	TODO	hard-coded assumption that this is file
	$api.rhino.classpath = new Packages.java.io.File(Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath"));
}

$api.slime = (function(was) {
	var rv;
	if (was && was.built) {
		rv = was;
		rv.launcher = new function() {
			this.getClasses = function() {
				return new Packages.java.io.File($api.script.file.getParentFile(), "jsh.jar");
			};
		}
	} else {
		rv = {};

		var script = $api.script;
		if (script.file && String(script.file.getParentFile().getName()) == "rhino") {
			rv.src = new function() {
				if (script.file) {
					this.toString = function() {
						return script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile().getParentFile().toString();
					};

					this.File = function(path) {
						$api.log("File: " + path);
						return new Packages.java.io.File(script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile().getParentFile(), path);
					}

					this.getFile = function(path) {
						return script.resolve("../../../" + path).file;
					}

					this.getSourceFilesUnder = function getSourceFilesUnder(dir,rv) {
						$api.log("Under: " + dir);
						if (typeof(rv) == "undefined") {
							rv = [];
						}
						var files = dir.listFiles();
						$api.log("files: " + files.length);
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
				} else {
					this.toString = function() {
						return script.url.toExternalForm();
					}
				}

				this.getPath = function(path) {
					$api.debug("getPath: " + path);
					return script.resolve("../../../" + path).toString();
				}
			};
		}

		rv.launcher = new function() {
			this.compile = function(p) {
				var to = (p && p.to) ? p.to : $api.io.tmpdir();
				$api.java.install.compile([
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
	}

	rv.setting = function(name) {
		if (Packages.java.lang.System.getProperty(name)) {
			return String(Packages.java.lang.System.getProperty(name));
		}
		var ename = name.replace(/\./g, "_").toUpperCase();
		if (Packages.java.lang.System.getenv(ename)) {
			return String(Packages.java.lang.System.getenv(ename));
		}
		return null;
	};

	rv.settings = new function() {
		var all = {};
		var PASS = function(value) {
			return value;
		};

		var CONTAINER = {
		};
		var LAUNCHER = {
		};
		var LOADER = {
		};
		var BOTH = {
			launcher: PASS,
			loader: PASS
		};

		var map = function(name,type) {
			all[name] = {
				type: type,
				value: rv.setting(name)
			};
		};


		map("jsh.debug.jdwp", {
			container: function(value) {
				return ["-agentlib:jdwp=" + value];
			}
		});
		map("jsh.debug.script", LOADER);

		map("jsh.jvm.options", {
			container: function(value) {
				return value.split(" ");
			}
		});
		map("jsh.log.java.properties", {
			container: function(value) {
				return ["-Djava.util.logging.config.file=" + value];
			}
		});

		map("jsh.engine", BOTH);
		map("jsh.engine.rhino.classpath", BOTH);

		//	Undocumented so far

		//	May not survive refactoring
		map("jsh.launcher.debug", LAUNCHER);
		map("jsh.shell.container", LAUNCHER);

		map("jsh.plugins", LOADER);

		//	TODO	not sure jsh.java.home is correct here
		map("jsh.java.home", BOTH);

		map("jsh.shell.src", BOTH);
		map("jsh.rhino.optimization", BOTH);
		map("jsh.tmpdir", {
			launcher: function(value) {
				return ["-Djava.io.tmpdir=" + value];
			},
			container: function(value) {
				return ["-Djava.io.tmpdir=" + value];
			}
		});

		this.get = function(name) {
			return all[name].value;
		}

		this.set = function(name,value) {
			all[name].value = value;
		}

		this.getContainerArguments = function() {
			var rv = [];
			for (var x in all) {
				var value = this.get(x);
				if (value) {
					if (all[x].type.container) {
						rv = rv.concat(all[x].type.container(value));
					} else {
						rv.push("-D" + x + "=" + value);
					}
				}
			}
			return rv;
		};

		this.getPropertyArguments = function() {
			var rv = [];
			for (var x in all) {
				var value = this.get(x);
				if (value) {
					rv.push("-D" + x + "=" + value);
				}
			}
			return rv;
		};

		this.sendPropertiesTo = function(f) {
			for (var x in all) {
				var value = this.get(x);
				if (value) {
					f(x,value);
				}
			}
		}

		this.environment = function(rv) {
			for (var x in all) {
				if (all[x].type.environment && all[x].value) {
					rv[x] = String(all[x].value);
				}
			}
		}
	};

	return rv;
})($api.slime);