var tmp = jsh.shell.TMPDIR.createTemporary({ prefix: "issue62.", suffix: ".txt" });
var _writer = new Packages.java.io.PrintWriter(new Packages.java.io.FileWriter(tmp.pathname.java.adapt()));
_writer.println("First line");
_writer.println("Second line");
_writer.close();
var rv = [];
tmp.readLines(function(line) {
	rv.push(line);
});
jsh.shell.echo(rv.join("|"));
