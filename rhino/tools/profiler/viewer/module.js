//	First, copy the HTML
var to;
var output = (typeof(to) != "undefined") ? to : jsh.shell.TMPDIR.createTemporary({ suffix: ".html" }).pathname;
var profiles;
if (!profiles && typeof($context) != "undefined" && $context && $context.profiles) {
	profiles = $context.profiles;
};
var html = $loader.resource("viewer.html").read(String);
var scriptElement = function(s) {
	return '<script type="text/javascript">' + s + "</script>";
}
//	TODO	this is pretty brittle; perhaps there is a better solution, especially as we mature jsdom
html = html.replace('<link rel="stylesheet" type="text/css" href="viewer.css" />', '<style type="text/css">' + $loader.resource("viewer.css").read(String) + "</style>");
html = html.replace('<script type="text/javascript" src="profiles.js"></script>', scriptElement("var profiles = " + jsh.js.toLiteral(profiles)));
html = html.replace('<script type="text/javascript" src="viewer.js"></script>', scriptElement($loader.resource("viewer.js").read(String)));

output.write(html, { append: false });
jsh.shell.echo("Wrote profiling data to " + output);
