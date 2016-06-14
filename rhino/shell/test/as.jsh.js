var parameters = jsh.script.getopts({
	options: {
		user: "root",
		scenario: String
	}
});

jsh.shell.run({
	command: "sudo",
	arguments: ["-k"]
});

var out = jsh.shell.run({
	command: "whoami",
	as: "root",
	stdio: {
		output: String
	},
	evaluate: function(result) {
		return result.stdio.output.substring(0,result.stdio.output.length-1);
	}
});
jsh.shell.echo("out = [" + out + "]");
