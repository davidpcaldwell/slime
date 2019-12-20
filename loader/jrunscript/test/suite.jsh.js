var parameters = jsh.script.getopts({
	options: {
		part: String,
		view: "console"
	}
});

var SRC = jsh.script.file.parent.parent.parent.parent;

var suite = new jsh.unit.html.Suite();
suite.add("slime", new jsh.unit.html.Part({
	pathname: SRC.getRelativePath("loader/api.html")
}));
suite.add("jrunscript/main", new jsh.unit.html.Part({
	pathname: SRC.getRelativePath("loader/jrunscript/api.html")
}));
suite.add("jrunscript/java", new jsh.unit.html.Part({
	pathname: SRC.getRelativePath("loader/jrunscript/java.api.html")
}));

jsh.unit.html.cli({
	suite: suite,
	part: parameters.options.part,
	view: parameters.options.view
});
