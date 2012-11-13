var jpath = jsh.file.Searchpath([
	jsh.shell.java.home.getRelativePath("bin")
]);
var launcher = jpath.getCommand("java");
if (!launcher) {
	jsh.shell.exit(1);
} else {
	jsh.shell.echo(launcher);
}
