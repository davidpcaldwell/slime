var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

var suite = new jsh.unit.Suite();

suite.part("success", {
	execute: function(scope,verify) {
		jsh.shell.jsh({
			shell: jsh.shell.jsh.src,
			script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
			arguments: [
				"-suite", jsh.shell.jsh.src.getFile("loader/browser/test/test/issue300.suite.js")
			],
			evaluate: function(result) {
				verify(result).status.is(0);
			}			
		})
	}
});

suite.part("failure", {
	execute: function(scope,verify) {
		jsh.shell.jsh({
			shell: jsh.shell.jsh.src,
			script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
			arguments: [
				"-suite", jsh.shell.jsh.src.getFile("loader/browser/test/test/issue300.suite.js"),
				"-parameter", "failure=true"
			],
			evaluate: function(result) {
				verify(result).status.is(1);
			}			
		})
	}
});

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
