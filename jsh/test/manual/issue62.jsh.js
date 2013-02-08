var rv = [];
jsh.script.file.getRelativePath("issue62.txt").file.readLines(function(line) {
	rv.push(line);
}, { ending: "\n" });
jsh.shell.echo(rv.join("|"));
