jsh.shell.jsh({
	fork: true,
	script: jsh.script.file.getRelativePath("jsh.unit.html.Scenario.jsh.js")
});
jsh.shell.jsh({
	fork: true,
	script: jsh.script.file.getRelativePath("../unit.jsh.js")
});
