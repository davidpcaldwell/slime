(function() {
	var parameters = jsh.script.getopts({
		options: {
			tsconfig: jsh.file.Pathname
		}
	});

	jsh.shell.tools.node.require();
	jsh.shell.tools.node.modules.require({ name: "typescript" });
	//	TODO	re-implement tsc.bash in terms of this script; see jsh/tools/install/typescript.jsh.js
	var base = jsh.script.file.parent.parent;
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