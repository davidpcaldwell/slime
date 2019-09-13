var parameters = jsh.script.getopts({
	options: {
		part: "jsh"
	}
});

var suite = new jsh.unit.Suite();

var part = new jsh.unit.html.Part({
	pathname: jsh.script.file.parent.getFile("issue302.api.html").pathname,
	part: "b"
});

var jshpath = part.getPath(["b"]);

suite.part("jsh", part);

// TODO: make this invocation easier
if (parameters.options.part == "browser") suite.part("browser", jsh.unit.Suite.Fork({
	run: jsh.shell.jsh,
	shell: jsh.shell.jsh.src,
	script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
	arguments: [
		"-definition", jsh.script.file.parent.getFile("issue302.api.html"),
		"-part", "b",
		"-default",
		"-interactive",
		"-chrome:instance", jsh.shell.jsh.src.getRelativePath("local/chrome/test")
	]
}));

if (parameters.options.part == "jsh") {
	path = ["jsh"].concat(jshpath);
} else {
	path = ["browser"];
}

jsh.unit.interface.create(suite, {
	path: path,
	view: "console"
});
