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
} else if (parameters.options.engine) {
	jsh.shell.jsh({
		fork: true,
		script: jsh.script.file.pathname,  
		arguments: ["-subshell"],
		environment: {
			JSH_ENGINE: parameters.options.engine
		},
		evaluate: function(result) {  
			if (result.status != 3) {  
				jsh.shell.echo(parameters.options.engine + ": Exit status should be 3; exit status is " + result.status);  
				jsh.shell.exit(1);  
			} else {
				jsh.shell.echo(parameters.options.engine + ": Exit status is 3");
			}
		}  
	});  
} else {
	var failure;
	["rhino","nashorn"].forEach(function(engine) {
		jsh.shell.jsh({
			fork: true,
			script: jsh.script.file.pathname,
			arguments: ["-engine",engine],
			evaluate: function(result) {
				jsh.shell.echo(engine + " Exit status: " + result.status);
				if (result.status != 0) {
					failure = true;
				}
			}
		});
	});
	if (failure) {
		jsh.shell.echo("Failed.");
		jsh.shell.exit(1);
	}
}
