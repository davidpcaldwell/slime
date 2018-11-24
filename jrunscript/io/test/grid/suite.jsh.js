var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

jsh.shell.console("Starting ...");

var suite = new jsh.unit.Suite();

suite.part("hello", {
	execute: function(scope,verify) {
		verify(jsh).io.grid.is.type("object");
		verify(jsh).io.grid.is.type("object");
		verify(jsh).io.grid.evaluate.property("Excel").is.type("function");
	}
});

// TODO: If view argument is omitted, fails or succeeds silently
jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
