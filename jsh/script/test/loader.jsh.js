var loader = new jsh.script.Loader("../../..");
jsh.shell.console("loader = " + loader);
var a = loader.module("loader/test/data/b/");
jsh.shell.echo(JSON.stringify({
	submodule: {
		message: a.submodule.message
	}
}));
