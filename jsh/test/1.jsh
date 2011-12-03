#JVM_OPTION		-Xmx64m
#CLASSPATH		/foo/bar/baz
#JDK_LIBRARY	lib/tools.jar

var parameters = jsh.shell.getopts({
	options: {
		modules: (jsh.shell.environment.MODULES) ? jsh.file.Pathname(jsh.shell.environment.MODULES) : jsh.file.Pathname
	}
});

var slime = jsh.loader.module(parameters.options.modules.directory.getRelativePath("1.slime"));
jsh.shell.echo(slime.data);
if (slime.data != "From Java") {
	jsh.shell.exit(1);
} else {
	jsh.shell.echo("Success: " + jsh.script.pathname.basename);
	jsh.shell.exit(0);
}
