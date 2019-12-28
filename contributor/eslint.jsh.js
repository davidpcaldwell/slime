jsh.shell.jsh({
	script: jsh.shell.jsh.src.getFile("jsh/tools/install/eslint.jsh.js")
});
jsh.shell.tools.node.run({
	command: "eslint",
	arguments: ["."],
	directory: jsh.shell.jsh.src,
	evaluate: function(result) {
		jsh.shell.exit(result.status);
	}
});
