if (jsh.script.script) {
	jsh.script.loader = new jsh.script.Loader(jsh.script.file.getRelativePath("packaged-path").directory);
}
var file = jsh.script.loader.file("file.js");
if (file.bar != "bar") {
	throw new Error("Failed to load file.");
}
var module = jsh.script.loader.module("path");
if (module.bar != "baz") {
	throw new Error("Failed to load module.");
}
jsh.shell.echo("Success: " + jsh.script.file.pathname.basename);
