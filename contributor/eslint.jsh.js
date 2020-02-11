var parameters = jsh.script.getopts({
	options: {
		project: jsh.shell.jsh.src.pathname
	}
});

jsh.shell.jsh({
	script: jsh.shell.jsh.src.getFile("jsh/tools/install/eslint.jsh.js")
});

jsh.shell.tools.node.run({
	command: "eslint",
	arguments: [/*"--debug",*/ "."],
	directory: parameters.options.project.directory,
	evaluate: function(result) {
		jsh.shell.exit(result.status);
	}
});
