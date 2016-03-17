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
//Packages.java.lang.System.err.println("slime.js: start");
var $api = this.$api;
//Packages.java.lang.System.out.println("$api.io = " + $api.io);
//Packages.java.lang.System.out.println("$api = " + Object.keys($api));
//Packages.java.lang.System.err.println("slime.js: $api = " + this.$api);
if (typeof(Packages.inonit.script.runtime.io.Streams) == "function") {
	$api.io.copy = function(i,o) {
		if (!arguments.callee.delegate) {
			arguments.callee.delegate = new Packages.inonit.script.runtime.io.Streams();
		}
		arguments.callee.delegate.copy(i,o);
	};
}

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
//	Packages.java.lang.System.err.println("Assigning $api.slime");
	if (was && was.built) {
		rv = was;
//		Packages.java.lang.System.err.println("Assigning $api.slime built");
		rv.launcher = new function() {
			this.getClasses = function() {
				return new Packages.java.io.File($api.script.file.getParentFile(), "jsh.jar");
			};
		}
//		Packages.java.lang.System.err.println("Assigned rv.launcher");
	} else {
//		Packages.java.lang.System.err.println("Assigning $api.slime not built");
		rv = {};

		var script = $api.script;
		var isSourceFile = script.file && String(script.file.getParentFile().getName()) == "launcher";
		var isHttp = script.url && /^http/.test(String(script.url.getProtocol()));
//		Packages.java.lang.System.err.println("script = " + script + " isSourceFile= " + isSourceFile + " isHttp=" + isHttp);
		if (isSourceFile || isHttp) {
			rv.src = new function() {
				if (script.file) {
					this.toString = function() {
						return script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile().toString();
					};

					var File = function(path) {
						return new Packages.java.io.File(script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile(), path);
					}

					this.File = function(path) {
						return new File(path);
					}

					this.getFile = function(path) {
						return script.resolve("../../" + path).file;
					}

					this.getSourceFilesUnder = function getSourceFilesUnder(dir,rv) {
						//$api.log("Under: " + dir);
						if (typeof(rv) == "undefined") {
							rv = [];
						}
						if (typeof(dir) == "string") {
							dir = new File(dir);
						}
						var files = dir.listFiles();
						//$api.log("files: " + files.length);
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
					var base = new Packages.java.net.URL(script.url, "../../");

					this.toString = function() {
						return base.toExternalForm();
					};

					var getSourceFilesUnder = function(url,rv) {
						var string = $api.engine.readUrl(url.toExternalForm());
						var lines = string.split("\n");
						for (var i=0; i<lines.length; i++) {
							if (/\/$/.test(lines[i])) {
								getSourceFilesUnder(new Packages.java.net.URL(url,lines[i]), rv);
							} else {
								if (/\.java$/.test(lines[i])) {
									rv.push(new Packages.java.net.URL(url, lines[i]));
								}
							}
						}
					}

					this.getSourceFilesUnder = function(path) {
						var under = new Packages.java.net.URL(base, path);
//						Packages.java.lang.System.err.println("getSourceFilesUnder: " + under);
						var rv = [];
						getSourceFilesUnder(under,rv);
//						Packages.java.lang.System.err.println(rv.join("\n"));
						return rv;
					}
				}

				this.getPath = function(path) {
					$api.debug("getPath: " + path);
					return script.resolve("../../" + path).toString();
				}
			};
		}

		rv.launcher = new function() {
			this.compile = function(p) {
				var to = (p && p.to) ? p.to : $api.io.tmpdir();
//				Packages.java.lang.System.err.println("to = " + to);
//				Packages.java.lang.System.err.println("rhino/system/java = " + rv.src.getPath("rhino/system/java"));
				var args = [
					"-Xlint:deprecation",
					"-Xlint:unchecked",
					"-d", to,
					"-sourcepath", rv.src.getPath("rhino/system/java") + Packages.java.io.File.pathSeparator + rv.src.getPath("jsh/launcher/java"),
					rv.src.getPath("jsh/launcher/java/inonit/script/jsh/launcher/Main.java")
				];
				args.push.apply(args,rv.src.getSourceFilesUnder(rv.src.getFile("rhino/system/java")))
//				Packages.java.lang.System.err.println("args = " + args.join(" "));
				$api.java.install.compile(args);
//				$api.java.install.compile([
//					"-Xlint:deprecation",
//					"-Xlint:unchecked",
//					"-d", to,
//					"-sourcepath", rv.src.getPath("rhino/system/java") + Packages.java.io.File.pathSeparator + rv.src.getPath("jsh/launcher/java"),
//					rv.src.getPath("jsh/launcher/java/inonit/script/jsh/launcher/Main.java")
//				]);
				if (!p || !p.to) return to;
			};

			this.getClasses = function() {
				return this.compile();
			}
		}
	}

//	Packages.java.lang.System.err.println("Assigning .setting");
	rv.setting = function(name) {
		if (Packages.java.lang.System.getProperty(name) !== null) {
			return String(Packages.java.lang.System.getProperty(name));
		}
		var ename = name.replace(/\./g, "_").toUpperCase();
		if (Packages.java.lang.System.getenv(ename) !== null) {
			return String(Packages.java.lang.System.getenv(ename));
		}
		return null;
	};

//	Packages.java.lang.System.err.println("Assigning .settings");
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
			var specified = (rv.setting(name) === null) ? void(0) : rv.setting(name);
			all[name] = {
				type: type,
				specified: specified
			};
		};


		map("jsh.debug.jdwp", {
			container: function(value) {
				if (value == "false") {
					return [];
				} else {
					return ["-agentlib:jdwp=" + value];
				}
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
		map("jsh.engine.rhino.optimization", BOTH);

		map("jsh.shell.tmpdir", {
			launcher: function(value) {
				return ["-Djava.io.tmpdir=" + value];
			},
			container: function(value) {
				return ["-Djava.io.tmpdir=" + value];
			}
		});

		//	Sent from launcher to loader
		map("jsh.shell.src", BOTH);
		map("jsh.shell.lib", BOTH);
//		map("jsh.shell.home", BOTH);
//		map("jsh.shell.packaged", BOTH);
//		map("jsh.shell.packaged.plugins", BOTH);

		//	TODO	not settled on these names for plugins
		map("jsh.shell.plugins", BOTH);
		map("jsh.shell.classpath", BOTH);
		map("jsh.shell.profiler", BOTH);
//		map("jsh.user.plugins", BOTH);

		//	Undocumented so far
		map("jsh.launcher.classpath", BOTH);
		map("jsh.launcher.script.api", BOTH);
		map("jsh.launcher.script.main", BOTH);

		//	May not survive refactoring
		map("jsh.launcher.debug", LAUNCHER);
		map("jsh.shell.container", LAUNCHER);

		map("jsh.plugins", LOADER);

		//	TODO	should be treated as JVM-level variable
		map("jsh.java.home", BOTH);

		//	TODO	Seem to be used in loader:
		//	Main.java:
		//	jsh.shell.packaged
		//
		//	rhino/shell/jsh.js:
		//	jsh.launcher.classpath

		this.get = function(name) {
			if (!all[name]) {
				throw new Error("Cannot read: " + name);
			}
			if (typeof(all[name].specified) != "undefined") {
				return all[name].specified;
			}
			if (typeof(all[name].value) != "undefined") {
				return all[name].value;
			}
			if (all[name]["default"]) {
				return all[name]["default"]();
			}
		}

		this.set = function(name,value) {
			if (!all[name]) throw new Error("Not defined: " + name);
			all[name].value = value;
		}

		this["default"] = function(name,value) {
			if (typeof(value) == "undefined") return;
			if (typeof(value) != "function") {
				value = (function(rv) {
					return function() {
						return rv;
					}
				})(value);
			}
			all[name]["default"] = value;
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
			if (typeof(f) == "object" && typeof(f.systemProperty) == "function") {
				f = (function(target) {
					return function(name,value) {
						target.systemProperty(name,value);
					};
				})(f);
			}
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

//	Packages.java.lang.System.err.println("Returning ...");

	return rv;
})($api.slime);