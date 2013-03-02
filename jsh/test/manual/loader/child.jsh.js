var loader = new jsh.file.Loader(jsh.script.file.parent);
var module = loader.module("child.module.js");
var method = module.$loader.resource;
if (typeof(method) == "undefined") {
	jsh.shell.echo("Resource method is undefined.");
	jsh.shell.exit(1);
} else {
	jsh.shell.echo("Success: resource method is " + method);
}
