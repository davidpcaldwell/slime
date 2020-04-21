(function() {
	var base = (function() {
		if (jsh.shell.environment.PROJECT) return jsh.file.Pathname(jsh.shell.environment.PROJECT).directory;
		return jsh.shell.PWD;
	})();

	if (!base.getFile("sdlc.js")) {
		jsh.shell.console("Directory " + base + " does not appear to be a project directory; no sdlc.js found.");
		jsh.shell.exit(1);
	}

	var project = new jsh.file.Loader({ directory: base }).module("sdlc.js", {
		base: base
	});

	var parameters = $api.Function.result(
		{
			options: {},
			arguments: jsh.script.arguments
		},
		function(p) {
			return {
				command: p.arguments[0],
				options: p.options,
				arguments: p.arguments.slice(1)
			}
		}
	);

	if (project.initialize) {
		project.initialize();
	}
	if (project[parameters.command]) {
		project[parameters.command]({
			options: parameters.options,
			arguments: parameters.arguments
		});
	}
})();
