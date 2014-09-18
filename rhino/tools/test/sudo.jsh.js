var parameters = jsh.script.getopts({
	options: {
		shell: false
	}
});

if (parameters.options.shell) {
	jsh.shell.os.sudo.desktop({
		command: "uname",
		arguments: [],
		directory: jsh.shell.jsh.home,
		askpass: {
			force: true,
			author: {
				command: jsh.shell.java.launcher,
				arguments: ["-jar",jsh.shell.jsh.home.getRelativePath("jsh.jar"),jsh.script.file.getRelativePath("../../../slime/rhino/tools/askpass.jsh.js"),"-prompt","Enter password to install ASepsis"],
			}
		},
		stdio: {
			output: String,
			error: String
		},
		evaluate: function(result) {
			jsh.shell.echo("command: " + result.command);
			jsh.shell.echo("arguments: " + result.arguments.join(" "));
			jsh.shell.echo("status: " + result.status);
			jsh.shell.echo("output: " + result.stdio.output);
			jsh.shell.echo("error : " + result.stdio.error);
		}
	});	
} else {
//	jsh.loader.plugins(jsh.script.file.parent.parent);
	jsh.shell.os.sudo.desktop({
		command: "uname",
		arguments: [],
		askpass: {
			prompt: "Enter password to test sudo"
		},
		stdio: {
			output: String,
			error: String
		},
		evaluate: function(result) {
			jsh.shell.echo("command: " + result.command);
			jsh.shell.echo("arguments: " + result.arguments.join(" "));
			jsh.shell.echo("status: " + result.status);
			jsh.shell.echo("output: " + result.stdio.output);
			jsh.shell.echo("error : " + result.stdio.error);
		}
	});
}

