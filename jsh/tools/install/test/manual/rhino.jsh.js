var parameters = jsh.script.getopts({
	options: {
		output: false,
		require: false
	}
});

if (parameters.options.require) {
	jsh.shell.tools.rhino.require();
}

if (parameters.options.output) {
	jsh.shell.echo(JSON.stringify({
		engine: jsh.shell.engine
	}));
	jsh.shell.exit(0);
}

//	First, remove Rhino
if (jsh.shell.jsh.lib.getFile("js.jar")) {
	jsh.shell.console("Remove Rhino first.");
	jsh.shell.exit(1);
}

var run = function(require) {
	jsh.shell.console("Running script ...");
	return jsh.shell.jsh({
		shell: jsh.shell.jsh.src,
		script: jsh.script.file,
		arguments: (function() {
			var rv = [];
			rv.push("-output");
			if (require) rv.push("-require");
			return rv;
		})(),
		stdio: {
			output: String
		},
		evaluate: function(result) {
			jsh.shell.console(result.stdio.output);
			return JSON.parse(result.stdio.output);
		}
	});
};

var fail = function() {
	jsh.shell.console("Failure.");
	jsh.shell.exit(1);
}

var before = run(false);
if (before.engine != "nashorn") fail();
var install = run(true);
if (install.engine != "rhino") fail();
var after = run(false);
if (after.engine != "rhino") fail();
jsh.shell.console("Success.");