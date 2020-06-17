//	TODO	this would be a useful automted test
var SLIME = jsh.script.file.parent.parent.parent.parent.parent;

var zero = jsh.shell.jsh({
	shell: jsh.shell.jsh.src,
	script: SLIME.getFile("jsh/test/jsh-data.jsh.js"),
	stdio: {
		output: String,
		error: String
	},
	evaluate: function(result) {
		if (result.stdio.error.length) {
			jsh.shell.console("Problem:\n" + result.stdio.error);
		}
		return !result.stdio.error.length;
	}
});

jsh.shell.exit( (zero) ? 0 : 1 );
