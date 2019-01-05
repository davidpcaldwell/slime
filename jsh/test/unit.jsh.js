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

		this.built = new function() {
			var home;

			var getHome = function() {
				if (!home) {
					if (parameters.options["shell:built"] && parameters.options["shell:built"].directory) {
//						jsh.shell.console("Unit tests using built shell provided by caller at " + parameters.options["shell:built"]);
						return parameters.options["shell:built"].directory;
					}
					if (jsh.shell.jsh.src) {
						var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.script.file.parent.parent.parent.getFile("jsh/etc/build.jsh.js"),
							arguments: [
								to,
								"-notest",
								"-nodoc"
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

			Object.defineProperty(this, "data", {
				get: function() {
					if (!data) {
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
	"jsh.shell": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("rhino/shell/plugin.jsh.api.html"),
		environment: environment
	}),
	"jsh.file/Searchpath": new jsh.unit.part.Html({
		pathname: SRC.getRelativePath("rhino/file/api.Searchpath.html")
	})
}

// TODO: remove this from 'old'
suite.part("$api", parts.$api);
suite.part("jsh.loader", parts["jsh.loader"]);
suite.part("jsh.file", {
	parts: {
		Searchpath: parts["jsh.file/Searchpath"]
	}
});
suite.part("jsh.shell", parts["jsh.shell"]);
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
