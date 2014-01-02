var parameters = jsh.script.getopts({
	options: {
		password: String,
		correct: false
	}
});
jsh.shell.run({
	command: "sudo",
	arguments: ["-k"]
});

var run = function() {
	jsh.shell.os.sudo({
		password: parameters.options.password,
		command: "ls",
		stdio: {
			error: String
		},
		evaluate: function(result) {
			if (result.status) {
				throw new Error("Exit status: " + result.status + " stderr: " + result.stdio.error);
			}
		}
	});
};

if (typeof(parameters.options.password) == "undefined") {
	try {
		run();
		jsh.shell.echo("Command succeeded but should have failed.");
		jsh.shell.exit(1);
	} catch (e) {
		if (e instanceof jsh.shell.os.sudo.PasswordRequired) {
			jsh.shell.echo("Correctly generated PasswordRequired exception.");
		} else {
			jsh.shell.echo("Wrong error: " + e);
			jsh.shell.exit(1);
		}
	}
} else if (parameters.options.correct) {
	try {
		run();
	} catch (e) {
		jsh.shell.echo("Unexpected exception: " + e);
		jsh.shell.exit(1);
	}
} else {
	try {
		run();
		jsh.shell.echo("Command succeeded but should have failed.");
		jsh.shell.exit(1);		
	} catch (e) {
		if (e instanceof jsh.shell.os.sudo.PasswordIncorrect) {
			jsh.shell.echo("Correctly generated PasswordIncorrect exception.");
		} else {
			jsh.shell.echo("Wrong error: " + e);
			jsh.shell.exit(1);
		}		
	}
}
