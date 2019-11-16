var parameters = jsh.script.getopts({
	options: {
		suite: jsh.file.Pathname,

		//	Runs a single definition; optionally just a single part of that definition
		definition: jsh.file.Pathname,
		part: String,

		parameter: jsh.script.getopts.ARRAY(String),

		view: "console"
	}
});

var suite = new jsh.unit.html.Suite();

var getParameters = function() {
	return parameters.options.parameter.map(function(string) {
		var tokens = string.split("=");
		return { name: tokens[0], value: tokens[1] }
	}).reduce(function(rv,pair) {
		rv[pair.name] = pair.value;
	}, {})
};

if (!parameters.options.suite && parameters.options.definition) {
	parameters.options.suite = jsh.script.file.parent.getRelativePath("definition.suite.js");
}

jsh.loader.run(
	parameters.options.suite,
	{
		$loader: new jsh.file.Loader({ directory: parameters.options.suite.file.parent }),
		definition: (parameters.options.definition) ? parameters.options.definition : void(0),
		parameters: getParameters(),
		suite: suite
	}
);

jsh.unit.html.cli({
	suite: suite,
	part: parameters.options.part,
	view: parameters.options.view
});
