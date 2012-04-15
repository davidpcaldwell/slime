if (jsh.script.getRelativePath) {
	jsh.script.loader = new jsh.script.Loader(jsh.script.getRelativePath("packaged-path"));
}
var file = jsh.script.loader.file("file.js");
if (file.bar != "bar") {
	throw new Error("Failed to load file.");
}
var module = jsh.script.loader.module("path");
if (module.bar != "baz") {
	throw new Error("Failed to load module.");
}
jsh.shell.echo("Success: packaged-path.jsh.js");
