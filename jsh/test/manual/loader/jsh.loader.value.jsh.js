if (!jsh.loader.value) {
	jsh.shell.exit(1);
}
var value = jsh.loader.value(jsh.script.file.parent.getRelativePath("jsh.loader.value.js"), { value: "bar" });
if (value.foo != "bar") {
	jsh.shell.console("foo = " + value.foo);
	jsh.shell.exit(1);
}
