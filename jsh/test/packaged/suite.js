//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	add feature to jsh.shell that handles JSON output automatically (like String output)
var jsonOutput = {
	stdio: function() {
		return {
			output: String
		}
	},
	evaluate: function(result) {
		if (result.status == 0) {
			try {
				result.output = JSON.parse(result.stdio.output);
			} catch (e) {
				jsh.shell.console("Could not parse: " + result.stdio.output);
			}
		}
		return result;
	}
};

var packaged = {
	build: function(p) {
		var TEST = src.getSubdirectory("jsh/test/packaged");
		var invocation = [];
	//	var invocation = [ getJshPathname(new File(JSH_HOME,"tools/package.jsh.js")) ];
		var script = (typeof(p.script) == "string") ? TEST.getFile(p.script) : p.script;
		invocation.push("-script",script);
		if (p.modules) {
			p.modules.forEach(function(module) {
				if (typeof(module) == "string") {
					invocation.push("-module", module + "=" + TEST.getRelativePath(module));
				} else if (module.from && module.to) {
					invocation.push("-module", module.to + "=" + TEST.getRelativePath(module.from));
				}
			});
		}
		if (p.files) {
			p.files.forEach(function(file) {
				if (typeof(file) == "string") {
					invocation.push("-file", file + "=" + TEST.getRelativePath(file));
				} else if (file.from && file.to) {
					invocation.push("-file", file.to + "=" + TEST.getRelativePath(file.from));
				}
			});
		}
		if (p.plugins) {
			p.plugins.forEach(function(plugin) {
				invocation.push("-plugin", TEST.getRelativePath(plugin));
			});
		}
		var packaged = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var to = packaged.getRelativePath(script.pathname.basename + ".jar");
		invocation.push("-to",to);
		if (!RHINO_LIBRARIES) invocation.push("-norhino");
		Packages.java.lang.System.err.println("arguments to packages.jsh.js = " + invocation);
		//	TODO	uses jsh.shell.jsh.home; should use version that is compatible with unbuilt shell
		//	TODO	if using unbuilt shell, need to copy over libraries into local/lib
		var shell = (function() {
			if (!p.unbuilt) return jsh.shell.jsh.home;
			//	Create a new shell to run as unbuilt
			var location = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
			location.directory.remove();
			jsh.shell.jsh.home.getSubdirectory("src").copy(location);
			jsh.shell.jsh.lib.getFile("js.jar").copy(location.directory.getRelativePath("local/jsh/lib/js.jar"), { recursive: true });
			return location.directory;
		})();
//		var shell = (p.unbuilt) ? jsh.shell.jsh.home.getSubdirectory("src") : jsh.shell.jsh.home;
		jsh.shell.console("Packaging using shell " + shell);
		jsh.shell.jsh({
			fork: true,
			shell: shell,
			script: jsh.shell.jsh.home.getFile("tools/package.jsh.js"),
			arguments: invocation
		});
		if (!to.file) {
			throw new Error("Packaged file not created: " + to + " class=" + to + " using " + jsh.shell.jsh.home + " and " + jsh.script.file);
		}
		//	TODO	refactor to return object with a run() method that allows jsonOutput to be easily used as well
		return {
			jar: to.file,
			run: function(p) {
				var argument = {
					jar: to.file
				};
				if (p.json) {
					argument.stdio = jsonOutput.stdio();
					argument.evaluate = jsonOutput.evaluate;
					delete p.json;
				}
				jsh.js.Object.set(argument,p);
				return jsh.shell.java(argument);
			}
		}
	}
}

$set({
	parts: {
		loader: {
			parts: new function() {
				this.compatibility = {
					execute: function(scope,verify) {
						var script = src.getFile("jsh/test/packaged/loader.jsh.js");
						var result = jsh.shell.jsh({
							fork: true,
							script: script,
							stdio: jsonOutput.stdio(),
							evaluate: jsonOutput.evaluate
						});
						verify(result).status.is(0);
						verify(result).output.file.foo.is("bar");
						verify(result).output.module.foo.is("baz");
					}
				};

				var test = function(unbuilt,verify) {
					if (!jsh.shell.environment.SKIP_PACKAGED_APPLICATIONS) {
						Packages.java.lang.System.err.println("Packaging loader.jsh.js ...");
						var jar = packaged.build({
							unbuilt: unbuilt,
							script: "loader.jsh.js",
							modules: [ { from: "module", to: "module" }, { from: "module", to: "path/module" }],
							files: [ { from: "file.js", to: "file.js" }, { from: "file.js", to: "path/file.js" }]
						});
						jsh.shell.console("Running " + jar.jar + " ...");
						var result = jsh.shell.java({
							jar: jar.jar,
							stdio: jsonOutput.stdio(),
							evaluate: jsonOutput.evaluate
						});
						verify(result).status.is(0);
						verify(result).output.file.foo.is("bar");
						verify(result).output.module.foo.is("baz");
						verify(result).output.path.file.foo.is("bar");
						verify(result).output.path.module.foo.is("baz");
					}
				}

				this.implementation = {
					execute: function(scope,verify) {
						test(false,verify);
					}
				};

				this.unbuilt = {
					execute: function(scope,verify) {
						test(true,verify);
					}
				}
			}
		},
		plugins: {
			parts: new function() {
				var check = function(verify,result) {
					var lines = function() { return this.output.split(LINE_SEPARATOR); };
					verify(result).status.is(0);
					verify(result).stdio.evaluate(lines)[0].is("a: Hello, World!");
					verify(result).stdio.evaluate(lines)[1].is("[global] a: Hello, World!");
				}

				this.compatibility = {
					execute: function(scope,verify) {
						var result = jsh.shell.jsh({
							fork: true,
							script: src.getFile("jsh/test/packaged/plugins.jsh.js"),
							environment: {
								LOAD_JSH_PLUGIN_TEST_PLUGIN: "true"
							},
							stdio: {
								output: String
							}
						});
						check(verify,result);
					}
				};

				this.implementation = {
					execute: function(scope,verify) {
						var packaged_plugins = packaged.build({
							script: "plugins.jsh.js",
							plugins: ["a"]
						});
						var windows = {};
						//	TODO	these are case-insensitive on Windows, so this may not work
						["TMP","TEMP","USERPROFILE"].forEach(function(name) {
							if (jsh.shell.environment[name]) {
								windows[name] = jsh.shell.environment[name];
							}
						});
						var result = jsh.shell.java({
							jar: packaged_plugins.jar,
							environment: jsh.js.Object.set({}, {
								LOAD_JSH_PLUGIN_TEST_PLUGIN: "true"
							}, (/^Windows/.test(jsh.shell.os.name)) ? windows : {}),
							stdio: {
								output: String
							}
						});
						verify(jsh.shell).environment.evaluate.property("JSH_PLUGINS").is.type("undefined");
						check(verify,result);
					}
				};
			}
		},
		classpath: {
			execute: function(scope,verify) {
				var jar = packaged.build({
					script: "../addClasses/addClasses.jsh.js"
				});
				var result = jsh.shell.java({
					jar: jar.jar,
					arguments: ["-classes",getClasses()]
				});
				verify(result).status.is(0);
			}
		},
		"jsh.script.file": {
			execute: function(scope,verify) {
				var jar = packaged.build({
					script: "jsh.script.file.jsh.js"
				});
				var result = jar.run({ json: true });
				verify(result).status.is(0);
				verify(result).output.file.is(jar.jar.toString());
				verify(result).output.resolved.is(jar.jar.toString());
			}
		}
	}
});
