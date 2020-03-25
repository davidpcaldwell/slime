var parameters = jsh.script.getopts({
	options: {
		project: jsh.shell.jsh.src.pathname
	}
});

jsh.shell.tools.node.require();
jsh.shell.tools.node.modules.require({ name: "eslint" });

jsh.shell.tools.node.run({
	command: "eslint",
	arguments: [/*"--debug",*/ "."],
	directory: parameters.options.project.directory,
	evaluate: function(result) {
		jsh.shell.exit(result.status);
	}
});
