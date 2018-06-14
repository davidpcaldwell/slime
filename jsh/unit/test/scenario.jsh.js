var parameters = jsh.script.getopts({
	options: {
		manual: false,
		view: "console"
	}
});

//	TODO	ability to use Scenario constructor is undocumented
var scenario = new jsh.unit.Scenario({
	execute: function(scope,verify) {
		verify(1).is(1);
	}
});
if (parameters.options.manual) {
	var view = new jsh.unit.view.Console({
		writer: jsh.shell.stdio.error
	});
	view.listen(scenario);
	scenario.run();
} else {
	jsh.unit.interface.create(scenario, {
		view: parameters.options.view
	});
}
