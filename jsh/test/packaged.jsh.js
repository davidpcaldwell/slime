var file = jsh.script.loader.file("packaged.file.js");
if (file.foo != "bar") {
	throw new Error("Failed to load file.");
}

var module = jsh.script.loader.module("packaged");
if (module.foo != "baz") {
	throw new Error("Failed to load module.");
}
jsh.shell.echo("Loaded both.");
