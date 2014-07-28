var parameters = jsh.script.getopts({
	options: {
		java: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		slime: jsh.file.Pathname,
		tomcat: jsh.file.Pathname,
		debug: false
	}
});

//	Provide way to set JSH_ENGINE?
if (!parameters.options.java.length) {
	parameters.options.java = [jsh.shell.java.home.pathname];
}

if (!parameters.options.slime) {
	jsh.shell.echo("Required: -slime");
	jsh.shell.exit(1);
}

parameters.options.java.forEach(function(jre) {
	var searchpath = jsh.file.Searchpath([jre.directory.getRelativePath("bin")]);

	jsh.shell.run({
		command: searchpath.getCommand("java"),
		arguments: [
			"-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
			parameters.options.slime.directory.getRelativePath("jsh/test/suite.jsh.js").toString(),
			jsh.shell.TMPDIR.createTemporary({ directory: true, prefix: "jsh-verify.", suffix: "" })
		],
		directory: parameters.options.slime.directory,
		environment: jsh.js.Object.set({}, jsh.shell.environment
			,{
				JSH_BUILD_DEBUG: (parameters.options.debug) ? "true" : "",
			}
			, (parameters.options.tomcat) ? { CATALINA_HOME: parameters.options.tomcat.toString() } : {}
		)
	});	
});
