var parameters = jsh.script.getopts({
	options: {
		output: false,
		require: false
	}
});

if (parameters.options.require) {
	jsh.shell.tools.node.require();
}

if (parameters.options.output) {
	jsh.shell.echo(JSON.stringify({
		node: (jsh.shell.tools.node.version) ? jsh.shell.tools.node.version.number : null
	}));
	jsh.shell.exit(0);
}

//	First, remove Rhino
if (jsh.shell.jsh.lib.getSubdirectory("node")) {
	jsh.shell.console("Remove Node.js first.");
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
	jsh.shell.console("Failure: " + arguments[0]);
	jsh.shell.exit(1);
}

var before = run(false);
if (before.node !== null) fail(before.node);
var install = run(true);
if (install.node != "12.16.1") fail(install.node);
var after = run(false);
if (after.node != "12.16.1") fail(after.node);
jsh.shell.console("Success.");