var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

jsh.shell.console("Starting ...");

var suite = new jsh.unit.Suite();

suite.part("definition", new jsh.unit.part.Html({
	pathname: jsh.script.file.parent.parent.parent.getRelativePath("grid.api.html")
}));

// TODO: If view argument is omitted, fails or succeeds silently
jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
