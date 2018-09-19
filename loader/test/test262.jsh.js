var parameters = jsh.script.getopts({
	options: {
		test: jsh.file.Pathname,
		suite: String
	}
});

var locations = {
	test262: jsh.shell.jsh.src.getRelativePath("local/test262")
};

if (!locations.test262.directory) {
	new jsh.tools.git.Repository({ remote: "https://github.com/tc39/test262.git" }).clone({
		to: locations.test262
	});
} else {
	if (parameters.options.suite) jsh.shell.console("TODO: update");
}

if (parameters.options.suite) {
	var files = locations.test262.directory.getSubdirectory(parameters.options.suite).list({
		filter: function() {
			return true;
		},
		descendants: function() {
			return true;
		}
	});
	var results = {
		passed: 0,
		total: 0
	};
	files.forEach(function(file) {
		jsh.shell.console(file);
		var result = jsh.shell.jsh({
			script: jsh.script.file,
			arguments: ["-test",file],
			evaluate: function(result) {
				return !Boolean(result.status);
			}
		});
		if (result) {
			jsh.shell.console("PASSED: " + file);
			results.passed++;
		} else {
			jsh.shell.console("FAILED: " + file);
		}
		jsh.shell.console("");
		results.total++;
	});
	jsh.shell.console("Passed: " + results.passed + "/" + results.total);
} else if (parameters.options.test) {
//	jsh.shell.console("Running: " + parameters.options.test);
	var print = function(s) {
		jsh.shell.console(s);
	}
	try {
		eval(locations.test262.directory.getFile("harness/assert.js").read(String));		
		eval(locations.test262.directory.getFile("harness/sta.js").read(String));
		var code = parameters.options.test.file.read(String);
		var yamlDelimiters = ["/*---","---*/"];
		var yaml = code.substring(code.indexOf(yamlDelimiters[0]) + yamlDelimiters[0].length, code.indexOf(yamlDelimiters[1]));
		//jsh.shell.console(yaml);
		var includes = (function(yaml) {
			var lines = yaml.split("\n");
			var includesParser = /^includes\: \[(.*)\]/;
			var includesString = lines.filter(function(line) {
				return includesParser.test(line);
			}).map(function(line) {
				return includesParser.exec(line)[1];
			})[0];
			return (includesString) ? includesString.split(",") : [];
		})(yaml);
		var include = includes.map(function(path) {
			return locations.test262.directory.getSubdirectory("harness").getFile(path).read(String);
		});
		for (var i=0; i<include.length; i++) {
			jsh.shell.console("Including " + includes[i]);
			eval(include[i]);
		}
		eval(code);
		jsh.shell.exit(0);
	} catch (e) {
		jsh.shell.console(e);
		jsh.shell.exit(1);
	}
}