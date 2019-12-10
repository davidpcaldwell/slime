var base = jsh.script.file.parent.parent.parent.parent;
jsh.shell.console(base);
var NODE_PATH = [base.getRelativePath("local/jsh/lib/node/lib/node_modules")];
jsh.shell.run({
	command: base.getFile("local/jsh/lib/node/bin/node"),
	arguments: function(rv) {
		rv.push(jsh.script.file.parent.getRelativePath("tsdoc.node.js"));
	},
	environment: $api.Object.compose(jsh.shell.environment, {
		NODE_PATH: jsh.file.Searchpath(NODE_PATH)
	})
});
