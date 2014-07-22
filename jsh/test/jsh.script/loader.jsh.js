var loader = new jsh.script.Loader("../../..");
jsh.shell.echo("loader = " + loader);
var a = loader.module("loader/test/data/b/");
jsh.shell.echo(a.submodule.message);
if (a.submodule.message != "ititit") {
	jsh.shell.exit(1);
}
