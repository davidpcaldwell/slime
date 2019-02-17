//	TODO	move to jsh.unit.html.Suite in loader/api/plugin.jsh.js?
var Suite = function(p) {
	var byName = {};

	var definition = {
		parts: {
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

$exports.Suite = Suite;

var Environment = function(p) {
	if (!p.src.getSubdirectory("contributor")) {
		throw new Error("p.src is " + p.src);
	}
	//	p.src (directory): source code of shell
	//	p.home (Pathname): location of built shell
	//	p.noselfping (boolean): if true, host cannot ping itself
	this.jsh = new function() {
		var getData = function(shell) {
			return jsh.shell.jsh({
				shell: shell,
				script: p.src.getFile("jsh/test/jsh-data.jsh.js"),
				stdio: {
					output: String
				},
				evaluate: function(result) {
					return JSON.parse(result.stdio.output);
				}
			});
		};

		this.src = p.src;

		var rhino = ((jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function")) ? jsh.shell.jsh.lib.getFile("js.jar") : null;

		//	TODO	we would like to memoize these functions, but what happens if a memoized function throws an error?

		var unbuilt;
		var built;

		if (!jsh.shell.environment.SLIME_UNIT_JSH_UNBUILT_ONLY) this.built = new function() {
			var getLocation = function() {
				if (!p.home) {
					var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
					p.home = tmp.pathname;
					tmp.remove();
				}
				return p.home;
			}

			var getHome = function() {
				getLocation();
				if (!p.home.directory) {
					jsh.shell.jsh({
						shell: jsh.shell.jsh.src,
						script: p.src.getFile("jsh/etc/build.jsh.js"),
						arguments: [
							p.home,
							"-notest",
							"-nodoc",
							// TODO: use command-line argument rather than hard-coding?
							"-executable"
						].concat(
							(jsh.shell.jsh.lib.getFile("js.jar")) ? ["-rhino", jsh.shell.jsh.lib.getFile("js.jar")] : []
						).concat(
							(p.executable) ? ["-executable"] : []
						)
						// TODO: below was from previous verify.jsh.js; is it helpful? On Windows, maybe? Looks like no-op
						// environment: jsh.js.Object.set({
						// 	//	TODO	next two lines duplicate logic in jsh.test plugin
						// 	TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
						// 	PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
						// 	PATH: jsh.shell.environment.PATH.toString()
						// })
					});
					if (p.tomcat) {
						jsh.shell.console("Installing Tomcat into built shell ...");
						jsh.shell.jsh({
							shell: p.home.directory,
							script: p.src.getFile("jsh/tools/install/tomcat.jsh.js")
						});
					}
				}
				return p.home.directory;
			}

			Object.defineProperty(this, "location", {
				get: function() {
					return getLocation();
				},
				enumerable: true
			});

			Object.defineProperty(this, "home", {
				get: function() {
					return getHome();
				},
				enumerable: true
			});

			Object.defineProperty(this, "data", {
				get: function() {
					if (!built) {
						built = getData(getHome());
					}
					return built;
				},
				enumerable: true
			});

			this.requireTomcat = function() {
				if (!this.home.getSubdirectory("lib/tomcat")) {
					jsh.shell.jsh({
						shell: this.home,
						script: p.src.getFile("jsh/tools/install/tomcat.jsh.js")
					})
				}
			}
		};

		this.unbuilt = new function() {
			this.src = p.src;

			this.lib = p.src.getRelativePath("local/jsh/lib").createDirectory({
				exists: function(dir) {
					return false;
				}
			});

			Object.defineProperty(this, "data", {
				get: function() {
					if (!unbuilt) {
						unbuilt = getData(p.src);
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
						script: p.src.getRelativePath("jsh/tools/package.jsh.js"),
						arguments: ([
							"-script", p.src.getRelativePath("jsh/test/jsh-data.jsh.js"),
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
			});
		};

		if (jsh.httpd.Tomcat) this.remote = new function() {
			var data;

			var url = "http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/";

			Object.defineProperty(this, "url", {
				get: function() {
					return url;
				}
			});

			// TODO: should this be allowed?
			var TRACE = false;

			var getMock = jsh.js.constant(function() {
				jsh.loader.plugins(p.src.getRelativePath("jsh/test/launcher"));
				var mock = new jsh.test.launcher.MockRemote({
					src: {
						davidpcaldwell: {
							slime: {
								directory: jsh.shell.jsh.src
							}
						}
					},
					trace: false
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

	this.noselfping = p.noselfping;
}

$exports.Environment = Environment;
