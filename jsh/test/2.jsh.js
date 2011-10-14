var file = jsh.loader.file(jsh.script.getRelativePath("2.js"));

if (typeof(file.x) != "undefined") jsh.shell.exit(1);
if (file.y != 3) jsh.shell.exit(1);

var buffer = new jsh.io.Buffer();

jsh.shell.jsh(jsh.script.getRelativePath("1.jsh"), [], {
	stdout: buffer,
	stderr: buffer,
	onExit: function(result) {
		buffer.close();
		jsh.shell.echo("output = " + buffer.readText().asString());
	}
});
jsh.shell.echo("Success!");
jsh.shell.exit(0);
