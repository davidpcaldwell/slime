var parameters = jsh.script.getopts({
	options: {
		view: "console"
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

var suite = new jsh.unit.Suite();
suite.part("browser", new jsh.unit.Suite.Fork({
	run: jsh.shell.jsh,
	shell: jsh.shell.jsh.src,
	script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
	arguments: [
		"-suite", jsh.script.file.parent.getFile("suite.js"),
		"-view", "stdio"
	].concat(parameters.arguments)
}));
jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
