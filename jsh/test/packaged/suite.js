var packaged = {
	build: function(p) {
		var TEST = src.getSubdirectory("jsh/test/packaged");
		var invocation = [];
	//	var invocation = [ getJshPathname(new File(JSH_HOME,"tools/package.jsh.js")) ];
		invocation.push("-script",TEST.getFile(p.script));
		if (p.modules) {
			p.modules.forEach(function(module) {
				if (typeof(module) == "string") {
					invocation.push("-module", module + "=" + TEST.getRelativePath(module));
				} else if (module.from && module.to) {
					throw new Error("No");
					invocation.push("-module", module.to + "=" + getJshPathname(new File(SLIME_SRC,"jsh/test/" + module.from)));
				}
			});
		}
		if (p.files) {
			p.files.forEach(function(file) {
				if (typeof(file) == "string") {
					invocation.push("-file", file + "=" + TEST.getFile(file));
				} else if (file.from && file.to) {
					throw new Error("no");
					invocation.push("-file", file.to + "=" + getJshPathname(new File(SLIME_SRC,"jsh/test/" + file.from)));
				}
			});
		}
		if (p.plugins) {
			p.plugins.forEach(function(plugin) {
				invocation.push("-plugin", TEST.getFile(plugin));
			});
		}
		var packaged = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var to = packaged.getRelativePath(p.script.split("/").slice(-1)[0] + ".jar");
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

var jsonScript = {
	stdio: {
		output: String
	},
	evaluate: function(result) {
		if (result.status == 0) {
			result.output = JSON.parse(result.stdio.output);
		}
		return result;
	}
}

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
							stdio: jsonScript.stdio,
							evaluate: jsonScript.evaluate
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
							var packagedPackaged = packaged.build({
								script: "loader.jsh.js",
								modules: [ "module/" ],
								files: ["file.js"]
							});				
							jsh.shell.console("Running " + packagedPackaged + " ...");
							var classes = jsh.shell.TMPDIR.createTemporary({ directory: true });
							var result = jsh.shell.java({
								jar: packagedPackaged,
								arguments: ["-classes",classes],
								stdio: {
									output: String
								},
								evaluate: function(result) {
									if (result.status == 0) {
										result.output = JSON.parse(result.stdio.output);
									}
									return result;
								}
							});
							verify(result).status.is(0);
							verify(result).output.file.foo.is("bar");
							verify(result).output.module.foo.is("baz");
						}				
					}
				}
			}
		}
	}
});
