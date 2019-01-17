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

var definition = new jsh.unit.part.Html({
	name: "jsh Unit Tests",
	pathname: jsh.script.file.parent.parent.parent.getRelativePath("jsh/etc/api.html"),
	environment: environment
});

var suite = new jsh.unit.Suite();

var SRC = jsh.script.file.parent.parent.parent;

var parts = {
	"$api": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("loader/$api.api.html")
	}),
	"jsh.loader": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("jsh/loader/loader.api.html"),
		environment: environment		
	}),
	"jsh.io": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("jrunscript/io/api.html"),
		environment: environment
	}),
	"jsh.shell": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("rhino/shell/plugin.jsh.api.html"),
		environment: environment
	}),
	"jsh.script": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("jsh/script/plugin.jsh.api.html"),
		environment: environment
	}),
	"jsh.file/Searchpath": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("rhino/file/api.Searchpath.html")
	}),
	"loader": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("jsh/loader/internal.api.html"),
		environment: environment				
	}),
	launcher: new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("jsh/launcher/internal.api.html"),
		environment: environment
	}),
	"jsh-tools": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("jsh/tools/internal.api.html"),
		environment: environment		
	})
};

var internal = {
	parts: {
		slime: new jsh.unit.part.Html({
			//	Functionality used internally or accessed through loader/jrunscript (although untested by loader/jrunscript)
			pathname: SRC.getRelativePath("loader/api.html")
		}),
		mime: new jsh.unit.part.Html({
			pathname: SRC.getRelativePath("loader/mime.api.html")
		}),
		jrunscript: new jsh.unit.part.Html({
			//	Test cases of loader implementation
			pathname: SRC.getRelativePath("loader/jrunscript/api.html")
		}),
		other: new jsh.unit.part.Html({
			//	Test cases involving the HTML test runner itself
			pathname: SRC.getRelativePath("loader/api/test/data/1/api.html")
		})
		//	TODO	loader/jrunscript/java has some tests
		//	TODO	loader/jrunscript/test/data/2/ has some tests but they require some classes in classpath
	}
};

suite.part("internal", internal);

suite.part("$api", parts.$api);
suite.part("jsh.loader", parts["jsh.loader"]);
suite.part("jsh.io", parts["jsh.io"]);
suite.part("jsh.file", {
	parts: {
		Searchpath: parts["jsh.file/Searchpath"]
	}
});
suite.part("jsh.shell", parts["jsh.shell"]);
suite.part("jsh.shell.jsh", new jsh.unit.Suite.Fork({
	// TODO: moved this from integration tests and reproduced current test without much thought; could be that we should not be
	// using the built shell, or should be using more shells
	run: jsh.shell.jsh,
	shell: (environment.jsh.built) ? environment.jsh.built.home : environment.jsh.unbuilt.src,
	script: SRC.getFile("rhino/shell/test/jsh.shell.jsh.suite.jsh.js"),
	arguments: ["-view","stdio"]
}));
suite.part("jsh.script", parts["jsh.script"]);
suite.part("loader", parts.loader);
suite.part("launcher", parts.launcher);
suite.part("jsh-tools", parts["jsh-tools"]);
suite.part("jsh.unit", new function() {
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
suite.part("old", definition);

var suitepath;
if (parameters.options.unit) {
	var tokens = parameters.options.unit.split(":");
	var partname = tokens[0];
	var partpath = (tokens.length > 1) ? tokens[1].split("/") : void(0);
	var partpage = parts[partname];
	if (partpage) {
		suitepath = partname.split("/");
		if (partpath) {
			suitepath = suitepath.concat(partpage.getPath(partpath));
		}
	} else if (suite.parts[partname]) {
		suitepath = [partname];
	} else {
		suitepath = ["old"].concat(definition.getPath(parameters.options.unit.split("/")));
	}
}

jsh.unit.interface.create(suite, new function() {
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
