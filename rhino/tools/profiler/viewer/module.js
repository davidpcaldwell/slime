//	First, copy the HTML
var output = (typeof($context) != "undefined" && $context && $context.to) ? $context.to.createDirectory({ ifExists: function(dir) { return false; }, recursive: true }) : jsh.shell.TMPDIR.createTemporary({ directory: true });
var profiles;
if (!profiles && typeof($context) != "undefined" && $context && $context.profiles) {
	profiles = $context.profiles;
};
["viewer.html", "viewer.js", "viewer.css"].forEach(function(path) {
	output.getRelativePath(path).write($loader.resource(path).read(jsh.io.Streams.binary), { append: false });	
});
output.getRelativePath("profiles.js").write("var profiles = " + jsh.js.toLiteral(profiles), { append: false });
jsh.shell.echo("Wrote profiling data to " + output.getRelativePath("viewer.html"));
