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
		view: "console",
		port: Number,
		"chrome:profile": jsh.file.Pathname,
		unit: String
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
			throw new Error();
		})();
		
		var rhino = ((jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function")) ? jsh.shell.jsh.lib.getFile("js.jar") : null;
		
		//	TODO	we would like to memoize these functions, but what happens if a memoized function throws an error?
		
		var unbuilt;
		var built;
		
		this.built = new function() {
			var home;
			
			var getHome = function() {
				if (!home) {
					if (jsh.shell.jsh.src) {
						var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.script.file.parent.getFile("build.jsh.js"),
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
							"-script", jsh.shell.jsh.src.getRelativePath("jsh/etc/jsh-data.jsh.js"),
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
						var script = url + "jsh/etc/jsh-data.jsh.js";
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
	pathname: jsh.script.file.parent.getRelativePath("api.html"),
	environment: environment
});

var find = function(definition,name,path) {
	if (!path) path = [];
	if (definition.name == name) return path;
	for (var x in definition.parts) {
		var found = find(definition.parts[x],name,path.concat([x]));
		if (found) return found;
	}
	return null;
}

var suite = new jsh.unit.Suite(definition);

jsh.unit.interface.create(suite, new function() {
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	}
	if (parameters.options.unit) {
		this.path = find(definition,parameters.options.unit);
	}
});
