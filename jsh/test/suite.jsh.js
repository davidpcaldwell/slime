var parameters = jsh.script.getopts({
	options: {
		java: jsh.shell.java.home.pathname,
		jsh: jsh.shell.jsh.home.pathname,
		src: jsh.script.file.getRelativePath("../..")
	}
});

jsh.shell.run({
	command: jsh.file.Searchpath([parameters.options.java.directory.getRelativePath("bin")]).getCommand("java"),
	arguments: [
		"-Djsh.home=" + parameters.options.jsh,
		"-Dslime.src=" + parameters.options.src,
		"-jar", parameters.options.jsh.directory.getRelativePath("lib/js.jar"),
		"-f", parameters.options.src.directory.getRelativePath("jsh/launcher/rhino/api.rhino.js"),
		parameters.options.src.directory.getRelativePath("jsh/test/suite.rhino.js")
	]
});
