var parameters = jsh.script.getopts({  
	options: {  
		subshell: false,
		engine: String
	}
});

if (parameters.options.subshell) {  
	try {  
		jsh.shell.exit(3);  
	} catch (e) {  
		jsh.shell.exit(2);  
	}
} else {
	jsh.shell.jsh({
		fork: true,
		script: jsh.script.file.pathname,  
		arguments: ["-subshell"],
		evaluate: function(result) {  
			if (result.status != 3) {  
				jsh.shell.echo("Exit status should be 3; exit status is " + result.status);  
				jsh.shell.exit(1);  
			} else {
				jsh.shell.echo("Exit status is 3");
			}
		}  
	});  
}
