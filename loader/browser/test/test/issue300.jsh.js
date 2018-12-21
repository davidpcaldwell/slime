var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

var suite = new jsh.unit.Suite(new jsh.unit.part.Html({
	pathname: jsh.script.file.parent.parent.getRelativePath("suite.jsh.api.html")
}));

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
