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

var $api = this.$api;

//	Provide better implementation that uses Java delegate, replacing pure JavaScript version supplied by api.js
if (typeof(Packages.inonit.script.runtime.io.Streams) == "function") {
	$api.io.copy = function(i,o) {
		if (!arguments.callee.delegate) {
			arguments.callee.delegate = new Packages.inonit.script.runtime.io.Streams();
		}
		arguments.callee.delegate.copy(i,o);
	};
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
		};

		rv.home = $api.script.file.getParentFile();
	} else {
		rv = {};

		var isSourceFile = $api.script.file && String($api.script.file.getParentFile().getName()) == "launcher";
		var isHttp = $api.script.url && /^http/.test(String($api.script.url.getProtocol()));
		if (isSourceFile || isHttp) {
			rv.src = new function() {
				if ($api.script.file) {
					this.toString = function() {
						return $api.script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile().toString();
					};

					var File = function(path) {
						return new Packages.java.io.File($api.script.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile(), path);
					}

					this.File = function(path) {
						return new File(path);
					}

					this.getFile = function(path) {
						return $api.script.resolve("../../" + path).file;
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
					var base = new Packages.java.net.URL($api.script.url, "../../");

					this.toString = function() {
						return base.toExternalForm();
					};

					var bitbucketGetSourceFilesUnder = function(url,rv) {
						//	Bitbucket raw URLs allow essentially listing the directory with a neline-delimited list of names,
						//	with directories ending with /.
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

					var getSourceFilesUnder = function(url,rv) {
						var pattern = /^http(?:s)?\:\/\/raw.githubusercontent.com\/davidpcaldwell\/slime\/(.*?)\/(.*)$/;
						var match = pattern.exec(url);
						if (!match) throw new Error("No match: " + url);
						//	TODO	make branch into ref query parameter
						var branch = match[1];
						var path = match[2];
						//	TODO	deal with http/https protocol issue
						var json = JSON.parse($api.engine.readUrl("http://api.github.com/repos/davidpcaldwell/slime/contents/" + path));
						json.forEach(function(item) {
							if (item.type == "dir") {
								getSourceFilesUnder(new Packages.java.net.URL(url,item.name+"/"), rv);
							} else {
								if (/\.java$/.test(item.name)) {
									rv.push(new Packages.java.net.URL(url, item.name));
								}
							}
						});
					}

					this.getSourceFilesUnder = function(path) {
						var under = new Packages.java.net.URL(base, path);
						var rv = [];
						getSourceFilesUnder(under,rv);
						return rv;
					}
				}

				this.getPath = function(path) {
					$api.debug("getPath: " + path);
					var rv = $api.script.resolve("../../" + path);
					//	TODO	this needs simplification
					if (rv == null) {
						if (this.File) {
							rv = new this.File(path).getAbsolutePath().toString()
						} else {
							$api.debug("getPath return null for: " + path);
							return null;
						}
					}
					return rv.toString();
				}
			};
		}

		rv.launcher = new function() {
			//	Exposed because it is used by jsh build script
			this.compile = function(p) {
				var to = (p && p.to) ? p.to : $api.io.tmpdir();
				var args = [
					"-Xlint:deprecation",
					"-Xlint:unchecked",
					"-d", to,
					"-sourcepath", rv.src.getPath("rhino/system/java") + Packages.java.io.File.pathSeparator + rv.src.getPath("jsh/launcher/java"),
					rv.src.getPath("jsh/launcher/java/inonit/script/jsh/launcher/Main.java")
				];
				args.push.apply(args,rv.src.getSourceFilesUnder(rv.src.getFile("rhino/system/java")));
				$api.java.install.compile(args);
				if (!p || !p.to) return to;
			};

			this.getClasses = function() {
				return this.compile();
			}
		}
	}

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

	rv.settings = new function() {
		var all = {};

		//	TODO	if these are actually indistinguishable, then below we are apparently using them as outdated documentation.
		//			Refactor until it makes sense.
		var LAUNCHER = {};
		var LOADER = {};
		var BOTH = {};

		var map = function(name,type) {
			//	If 'type' has a container property, it will be invoked with the setting effective value to get an array of
			//	string arguments to pass to the container/loader VM.
			all[name] = {
				type: type
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
		map("jsh.profiler.script", LOADER);

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
		// map("jsh.shell.home", BOTH);
		// map("jsh.shell.packaged", BOTH);
		// map("jsh.shell.packaged.plugins", BOTH);

		//	TODO	not settled on these names for plugins
		map("jsh.shell.classes", BOTH);
		map("jsh.shell.plugins", BOTH);
		map("jsh.shell.classpath", BOTH);
		map("jsh.shell.profiler", BOTH);
		// map("jsh.user.plugins", BOTH);

		//	Undocumented so far
		map("jsh.launcher.script.api", BOTH);
		map("jsh.launcher.script.main", BOTH);

		//	May not survive refactoring
		map("jsh.launcher.debug", LAUNCHER);
		map("jsh.shell.container", LAUNCHER);

		map("jsh.plugins", LOADER);

		//	TODO	should be treated as JVM-level variable
		map("jsh.java.home", BOTH);

		map("jsh.loader.noproxy", BOTH);
		map("jsh.github.api.protocol", BOTH);

		//	TODO	Seem to be used in loader:
		//	Main.java:
		//	jsh.shell.packaged

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
		};

		var get = function(name) {
			var value = rv.setting(name);
			return (value === null) ? void(0) : value;
		};

		this.get = function(name) {
			if (!all[name]) {
				throw new Error("Cannot read: " + name);
			}
			var specified = get(name);
			if (typeof(specified) != "undefined") {
				return specified;
			}
			if (all[name] && typeof(all[name].value) != "undefined") {
				return all[name].value;
			}
			if (all[name] && all[name]["default"]) {
				return all[name]["default"]();
			}
		}

		//	Added to VM arguments for loader VM
		this.getContainerArguments = function() {
			var rv = [];
			for (var x in all) {
				var value = this.get(x);
				if (value) {
					if (all[x].type.container) {
						rv = rv.concat(all[x].type.container(value));
					} else {
						// rv.push("-D" + x + "=" + value);
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

	return rv;
})($api.slime);
