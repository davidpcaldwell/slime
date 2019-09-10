var parameters = jsh.script.getopts({
	options: {
		part: String,
		view: "console"
	}
});

var suite = new jsh.unit.html.Suite();

var code = jsh.script.file.parent.parent;

if (jsh.shell.tools.jsoup.installed) suite.add("jrunscript", new jsh.unit.part.Html({
	pathname: code.getRelativePath("api.html")
}));

suite.add("browser", jsh.unit.Suite.Fork({
	name: "browser",
	run: jsh.shell.jsh,
	shell: jsh.shell.jsh.src,
	script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
	arguments: [
		"-definition", code.getRelativePath("api.html"),
		"-browser", "chrome",
		"-view", "stdio"
	].concat(parameters.arguments)//,
	// TODO: is setting the working directory necessary?
//	directory: environment.jsh.src
}));

jsh.unit.html.cli({
	suite: suite,
	part: parameters.options.part,
	view: parameters.options.view
});
