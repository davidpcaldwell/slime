var parameters = jsh.script.getopts({
	options: {
		part: String,
		view: "console"
	}
});

var engines = (function() {
	var rv = [];
	if (jsh.shell.jsh.lib.getFile("js.jar")) rv.push("rhino");
	if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) rv.push("nashorn");
	if (jsh.shell.jsh.lib.getSubdirectory("graal")) rv.push("graal");
	return rv;
})();

var Environment = jsh.script.loader.file("jrunscript-environment.js").Environment;

var environment = new Environment({
	src: jsh.script.file.parent.parent,
	noselfping: parameters.options.noselfping,
	tomcat: true,
	executable: true
});

var suite = new jsh.unit.html.Suite();

engines.forEach(function(engine) {
	suite.add(engine, {
		parts: new function() {
			this.property = {
				// TODO: tests unbuilt shells only because built shells would not necessarily have the same libraries (Rhino/Graal).
				// will need to revisit this.
				// TODO: consider migrating to and combining with jsh/launcher/internal.api.html
				execute: function(scope,verify) {
					var output = jsh.shell.jsh({
						shell: environment.jsh.unbuilt.src,
						script: environment.jsh.src.getFile("jsh/test/jsh-data.jsh.js"),
						environment: Object.assign({}, jsh.shell.environment, {
							JSH_ENGINE: engine
						}),
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return JSON.parse(result.stdio.output);
						}
					});
					verify(output).properties["jsh.engine"].is(engine);		
				}
			};

			var SRC = environment.jsh.src;

			this.runtime = jsh.unit.Suite.Fork({
				name: "SLIME Java runtime",
				run: jsh.shell.jsh,
				shell: SRC,
				script: SRC.getFile("loader/jrunscript/test/suite.jsh.js"),
				arguments: ["-view", "stdio"],
				environment: $api.Object.compose(jsh.shell.environment, {
					JSH_ENGINE: engine
				})
			});

			if (engine == "rhino") this.optimization = {
				execute: function(scope,verify) {
					[-1,0,1].forEach(function(level) {
						if (environment.jsh.unbuilt.src.getFile("local/jsh/lib/coffee-script.js")) {
							// TODO: If CoffeeScript is present, jsh should completely ignore optimization level
							jsh.shell.console("Skipping Rhino optimization tests for level " + level + "; CoffeeScript present.");
							return;
						}
						var result = jsh.shell.jsh({
							shell: environment.jsh.unbuilt.src,
							script: environment.jsh.src.getFile("jsh/test/jsh-data.jsh.js"),
							environment: jsh.js.Object.set({}, jsh.shell.environment, {
								JSH_ENGINE: "rhino",
								JSH_ENGINE_RHINO_OPTIMIZATION: String(level)
							}),
							stdio: {
								output: String
							},
							evaluate: function(result) {
								return JSON.parse(result.stdio.output);
							}
						});
						verify(result).engines.current.name.is("rhino");
						verify(result).engines.current.optimization.is(level);
					});
				}
			}
		}
	});
});

jsh.unit.html.cli({
	suite: suite,
	part: parameters.options.part,
	view: parameters.options.view
});
