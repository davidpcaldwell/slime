(function() {
	var parameters = jsh.script.getopts({
		options: {
			tsconfig: jsh.file.Pathname,
			version: String
		}
	});

	jsh.shell.tools.node.require();
	var base = jsh.script.file.parent.parent;
	var project = (parameters.options.tsconfig) ? parameters.options.tsconfig.parent.directory : base;
	var tsVersion = (function() {
		if (parameters.options.version) return parameters.options.version;
		if (project.getFile("tsc.version")) return project.getFile("tsc.version").read(String);
		return "4.0.5";
	})();
	jsh.shell.console("Use TypeScript version: " + tsVersion);
	jsh.shell.tools.node.modules.require({ name: "typescript", version: tsVersion });
	//	TODO	re-implement tsc.bash in terms of this script; see jsh/tools/install/typescript.jsh.js
	var PATH = jsh.file.Searchpath(jsh.shell.PATH.pathnames.concat([base.getRelativePath("local/jsh/lib/node/bin")]));
	var environment = $api.Object.compose(jsh.shell.environment, {
		PATH: PATH.toString()
	});
	var tsconfig_json = (parameters.options.tsconfig) ? parameters.options.tsconfig : base.getRelativePath("jsconfig.json");
	jsh.shell.run({
		command: base.getRelativePath("local/jsh/lib/node/bin/tsc"),
		arguments: [
			"--p", tsconfig_json
		],
		environment: environment,
		evaluate: function(result) {
			jsh.shell.exit(result.status);
		}
	});
})();