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
		Packages.java.lang.System.err.println("arguments = " + invocation);
		//	TODO	uses jsh.shell.jsh.home; should use version that is compatible with unbuilt shell
		jsh.shell.jsh({
			fork: true,
			script: jsh.shell.jsh.home.getFile("tools/package.jsh.js"),
			arguments: invocation
		});
		if (!to.file) {
			throw new Error("Packaged file not created: " + to + " class=" + to + " using " + jsh.shell.jsh.home + " and " + jsh.script.file);
		}
		return to.file;
	},
	run: function(p) {

	}
}

//	TODO	add feature to jsh.shell that handles JSON output automatically (like String output)
var jsonOutput = {
	stdio: function() {
		return {
			output: String
		}
	},
	evaluate: function(result) {
		if (result.status == 0) {
			result.output = JSON.parse(result.stdio.output);
		}
		return result;
	}
};

$set({
	parts: {
		loader: {
			parts: {
				compatibility: {
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
				},
				implementation: {
					execute: function(scope,verify) {
						if (!jsh.shell.environment.SKIP_PACKAGED_APPLICATIONS) {
							Packages.java.lang.System.err.println("Packaging loader.jsh.js ...");
							var jar = packaged.build({
								script: "loader.jsh.js",
								modules: [ { from: "module", to: "module" }, { from: "module", to: "path/module" }],
								files: [ { from: "file.js", to: "file.js" }, { from: "file.js", to: "path/file.js" }]
							});
							jsh.shell.console("Running " + jar + " ...");
							var result = jsh.shell.java({
								jar: jar,
								stdio: jsonOutput.stdio(),
								evaluate: jsonOutput.evaluate
							});
							verify(result).status.is(0);
							verify(result).output.file.foo.is("bar");
							verify(result).output.module.foo.is("baz");
							verify(result).output.path.file.foo.is("bar");
							verify(result).output.path.module.foo.is("baz");
							
//							var withPath = packaged.build({
//								script: "loader.jsh.js",
//								modules: [ { from: "module", to: "path/module" } ],
//								files: [ { from: "file.js", to: "path/file.js" } ]
//							});
//							var withPathResult = jsh.shell.java({
//								jar: withPath,
//								arguments: [],
//								stdio: jsonOutput.stdio(),
//								evaluate: jsonOutput.evaluate
//							});
//							verify(withPathResult).status.is(0);
						}				
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
						var result = jsh.shell.java({
							jar: packaged_plugins,
							environment: {
								LOAD_JSH_PLUGIN_TEST_PLUGIN: "true"								
							},
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
					jar: jar,
					arguments: ["-classes",getClasses()]
				});
				verify(result).status.is(0);
			}
		}
	}
});
