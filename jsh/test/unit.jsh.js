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

var parameters = jsh.script.getopts({
	options: {
		built: false,
		"shell:built": jsh.file.Pathname,
		view: "console",
		port: Number,
		"chrome:profile": jsh.file.Pathname,
		unit: String,
		noselfping: false
	}
});

var environment = new function() {
	this.jsh = new function() {
		var getData = function(shell) {
			return jsh.shell.jsh({
				shell: shell,
				script: jsh.script.file.parent.getFile("jsh-data.jsh.js"),
				stdio: {
					output: String
				},
				evaluate: function(result) {
					return JSON.parse(result.stdio.output);
				}
			});
		};

		this.src = (function() {
			if (jsh.shell.jsh.src) return jsh.shell.jsh.src;
			throw new Error("Currently can only run unit tests in unbuilt shell.");
		})();

		var rhino = ((jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function")) ? jsh.shell.jsh.lib.getFile("js.jar") : null;

		//	TODO	we would like to memoize these functions, but what happens if a memoized function throws an error?

		var unbuilt;
		var built;

		if (!jsh.shell.environment.SLIME_UNIT_JSH_UNBUILT_ONLY) this.built = new function() {
			var home;

			var getHome = function() {
				if (!home) {
					if (parameters.options["shell:built"] && parameters.options["shell:built"].directory) {
//						jsh.shell.console("Unit tests using built shell provided by caller at " + parameters.options["shell:built"]);
						return parameters.options["shell:built"].directory;
					}
					if (jsh.shell.jsh.src) {
						var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
						// TODO: So is this Rhino-only shell?
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.script.file.parent.parent.parent.getFile("jsh/etc/build.jsh.js"),
							arguments: [
								to,
								"-notest",
								"-nodoc",
								"-executable"
							]
						});
						home = to;
					} else {
						throw new Error();
					}
				}
				return home;
			}

			Object.defineProperty(this, "home", {
				get: function() {
					return getHome();
				},
				enumerable: true
			})

			Object.defineProperty(this, "data", {
				get: function() {
					if (!built) {
						built = getData(getHome());
					}
					return built;
				},
				enumerable: true
			});
		};

		this.unbuilt = new function() {
			this.src = jsh.shell.jsh.src;

			Object.defineProperty(this, "data", {
				get: function() {
					if (!unbuilt) {
						if (jsh.shell.jsh.src) {
							unbuilt = getData(jsh.shell.jsh.src);
						} else {
							throw new Error();
						}
					}
					return unbuilt;
				},
				enumerable: true
			});
		};

		var packagingShell = this.built;

		this.packaged = new function() {
			var shell;
			var data;

			var getShell = function() {
				if (!shell) {
					var to = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("packaged.jar");
					jsh.shell.jsh({
						shell: packagingShell.home,
						script: jsh.shell.jsh.src.getRelativePath("jsh/tools/package.jsh.js"),
						arguments: ([
							"-script", jsh.shell.jsh.src.getRelativePath("jsh/test/jsh-data.jsh.js"),
							"-to", to
						]).concat( (!rhino) ? ["-norhino"] : [] )
					});
					shell = to.file;
				}
				return shell;
			};

			Object.defineProperty(this, "jar", {
				get: function() {
					return getShell();
				},
				enumerable: true
			});

			Object.defineProperty(this, "data", {
				get: function() {
					if (!data) {
						data = jsh.shell.java({
							jar: getShell(),
							stdio: {
								output: String
							},
							evaluate: function(result) {
								return JSON.parse(result.stdio.output);
							}
						});
						jsh.shell.console("Packaged data: " + JSON.stringify(data));
					}
					return data;
				},
				enumerable: true
			})
		};

		if (jsh.httpd.Tomcat) this.remote = new function() {
			var data;

			var url = "http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/";

			Object.defineProperty(this, "url", {
				get: function() {
					return url;
				}
			});
			
			var getMock = jsh.js.constant(function() {
				jsh.loader.plugins(jsh.script.file.parent.parent.parent.getRelativePath("jsh/test/launcher"));
				var mock = new jsh.test.launcher.MockRemote({
					src: {
						davidpcaldwell: {
							slime: {
								directory: jsh.shell.jsh.src
							}
						}
					},
					trace: parameters.options["trace:server"]
				});
				jsh.shell.console("Mock port is " + mock.port);
				return mock;
			});

			Object.defineProperty(this, "data", {
				get: function() {
					if (!data) {
						var mock = getMock();
						var script = url + "jsh/test/jsh-data.jsh.js";
						data = mock.jsh({
							script: script,
							stdio: {
								output: String
							},
							evaluate: function(result) {
								return JSON.parse(result.stdio.output);
							}
						});
					}
					return data;
				},
				enumerable: true
			});
			
			this.jsh = function(p) {
				return getMock().jsh(p);
			}
		}
	}

	this.noselfping = parameters.options.noselfping;
}

if (parameters.options.built) {
	var home = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.jsh({
		shell: jsh.shell.jsh.src,
		script: jsh.script.file.parent.getFile("build.jsh.js"),
		arguments: [
			home,
			"-notest",
			"-nodoc"
		]
	});
	jsh.shell.jsh({
		shell: home,
		script: jsh.script.file,
		arguments: (function(rv) {
			rv.push("-view",parameters.options.view);
			if (parameters.options.port) rv.push("-port",parameters.options.port);
			if (parameters.options["-chrome:profile"]) rv.push("-chrome:profile",parameters.options["chrome:profile"]);
			if (parameters.options.unit) rv.push("-unit",parameters.options.unit);
			return rv;
		})([]),
		evaluate: function(result) {
			jsh.shell.exit(result.status);
		}
	})
}

//var suite = new jsh.unit.Suite();

var old = new jsh.unit.part.Html({
	name: "jsh/etc/api.html tests",
	pathname: jsh.script.file.parent.parent.parent.getRelativePath("jsh/etc/api.html"),
	environment: environment
});

var Suite = function() {
	var byName = {};
	
	var definition = {
		parts: {
			old: old
		}
	};
	
	this.add = function(path,part) {
		byName[path] = part;
		var tokens = path.split("/");
		var target = definition;
		for (var i=0; i<tokens.length; i++) {
			if (i == tokens.length-1) {
				target.parts[tokens[i]] = part;
			} else {
				if (!target.parts[tokens[i]]) {
					target.parts[tokens[i]] = {
						parts: {}
					}
				}
				target = target.parts[tokens[i]];
			}
		}
	};
	
	this.part = function(name) {
		return byName[name];
	};
	
	this.parts = definition.parts;
	
	this.build = function() {
		return new jsh.unit.Suite(definition);
	}
}

var suite = new Suite();

var SRC = jsh.script.file.parent.parent.parent;

suite.add("internal/slime", new jsh.unit.part.Html({
		//	Functionality used internally or accessed through loader/jrunscript (although untested by loader/jrunscript)
	pathname: SRC.getRelativePath("loader/api.html")
}));
suite.add("internal/mime", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("loader/mime.api.html")	
}));
suite.add("internal/jrunscript", new jsh.unit.part.Html({
	//	Test cases of loader implementation
	pathname: SRC.getRelativePath("loader/jrunscript/api.html")
}));
suite.add("internal/other", new jsh.unit.part.Html({
	//	Test cases involving the HTML test runner itself
	pathname: SRC.getRelativePath("loader/api/test/data/1/api.html")
	//	TODO	loader/jrunscript/java has some tests
	//	TODO	loader/jrunscript/test/data/2/ has some tests but they require some classes in classpath	
}));

suite.add("launcher", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/launcher/internal.api.html"),
	environment: environment
}));

suite.add("$api", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("loader/$api.api.html")	
}));

suite.add("jsh.loader", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/loader/loader.api.html"),
	environment: environment	
}));

suite.add("jsh.js/other", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("js/object/api.html")	
}));
suite.add("jsh.js/Error", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("js/object/Error.api.html")
}));

suite.add("jsh.io", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jrunscript/io/api.html"),
	environment: environment	
}));

suite.add("jsh.shell", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/shell/plugin.jsh.api.html"),
	environment: environment	
}));

suite.add("jsh.script", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/script/plugin.jsh.api.html"),
	environment: environment	
}));

suite.add("jsh.file/Searchpath", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/file/api.Searchpath.html")	
}));

suite.add("loader", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/loader/internal.api.html"),
	environment: environment
}));

suite.add("jsh-tools", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/tools/internal.api.html"),
	environment: environment
}));

suite.add("jsh.shell.jsh", new jsh.unit.Suite.Fork({
	// TODO: moved this from integration tests and reproduced current test without much thought; could be that we should not be
	// using the built shell, or should be using more shells
	run: jsh.shell.jsh,
	shell: (environment.jsh.built) ? environment.jsh.built.home : environment.jsh.unbuilt.src,
	script: SRC.getFile("rhino/shell/test/jsh.shell.jsh.suite.jsh.js"),
	arguments: ["-view","stdio"]	
}));

suite.add("jsh.unit", new function() {
	var src = SRC;
	this.parts = {
		htmlReload: {
			execute: function(scope,verify) {
				var result = jsh.shell.jsh({
					shell: src,
					script: src.getFile("jsh/unit/test/fail.jsh.js"),
					evaluate: function(result) {
						return result;
					}
				});
				verify(result).status.is(1);
			}
		},
		// htmlReload: new ScriptPart({
		// 	shell: src,
		// 	script: src.getFile("jsh/unit/test/fail.jsh.js"),
		// 	check: function(verify) {
		// 		verify(this).status.is(1);
		// 	}
		// }),
		suiteWithScenario: new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: src,
			script: src.getFile("jsh/unit/test/suite.jsh.js"),
			arguments: [
				"-view", "stdio"
			]
		}),
		nakedScenario: new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: src,
			script: src.getFile("jsh/unit/test/scenario.jsh.js"),
			arguments: [
				"-view", "stdio"
			]
		}),
	}
});

var requireTomcat = function() {
	if (!environment.jsh.built.home.getSubdirectory("lib/tomcat")) {
		jsh.shell.jsh({
			shell: environment.jsh.built.home,
			script: environment.jsh.src.getFile("jsh/tools/install/tomcat.jsh.js")
		})
	}
}

// TODO: move to rhino/http/servlet, creating internal.api.html?
var servletPart = new function() {
	// TODO: enable
	var COFFEESCRIPT = false;
	
	this.initialize = function() {
		requireTomcat();
	};

	this.parts = {};
	 
	this.parts.suite = {
		execute: function(scope,verify) {
			var result = jsh.shell.jsh({
				shell: environment.jsh.built.home,
				script: environment.jsh.src.getFile("jsh/test/jsh.httpd/httpd.jsh.js")
			});
			verify(result).status.is(0);
		}
	};
	
	if (COFFEESCRIPT) {
		this.parts.coffee = {
			execute: function(scope,verify) {
				var result = jsh.shell.jsh({
					shell: environment.jsh.built.home,
					script: environment.jsh.src.getFile("jsh/test/jsh.httpd/httpd.jsh.js"),
					arguments: ["-suite", "coffee"]
				});
				verify(result).status.is(0);
			}			
		}
	}
};
suite.add("servlet", servletPart);

// TODO: would be nice to add this to an initialize() method of browser test suite, but need to figure out how that would work.
requireTomcat();

var browserPart = jsh.unit.Suite.Fork({
	name: "Browser suites",
	run: jsh.shell.jsh,
	shell: environment.jsh.home,
	script: environment.jsh.src.getFile("loader/browser/suite.jsh.js"),
	arguments: [
		"-view", "stdio"
	].concat(parameters.arguments),
	// TODO: is setting the working directory necessary?
	directory: environment.jsh.src
});
suite.add("browser", browserPart);

var suitepath;
if (parameters.options.unit) {
	var tokens = parameters.options.unit.split(":");
	var partname = tokens[0];
	var partpath = (tokens.length > 1) ? tokens[1].split("/") : void(0);
	var partpage = suite.part(partname);
	if (partpage) {
		suitepath = partname.split("/");
		if (partpath) {
			suitepath = suitepath.concat(partpage.getPath(partpath));
		}
	} else if (suite.parts[partname]) {
		suitepath = [partname];
	} else {
		suitepath = ["old"].concat(old.getPath(parameters.options.unit.split("/")));
	}
}

jsh.unit.interface.create(suite.build(), new function() {
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	}
	this.path = suitepath;
});
