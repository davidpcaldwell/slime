if (typeof(jsh.shell.PATH) == "undefined") {
	throw new Error("PATH should be defined.");
}
if (typeof(jsh.shell.environment.PATH) == "undefined") {
	if (jsh.shell.PATH.pathnames.length > 0) {
		throw new Error("PATH should be empty.");
	}
}
jsh.shell.echo("Passed.");
