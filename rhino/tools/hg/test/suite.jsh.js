var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

var suite = new jsh.unit.Suite({
	parts: {
		module: new jsh.unit.part.Html({
			name: "module",
			pathname: jsh.script.file.parent.parent.getRelativePath("api.html"),
			environment: {},
			reload: true
		})
	}
});

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
