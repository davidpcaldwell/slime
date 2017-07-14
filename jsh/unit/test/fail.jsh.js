jsh.shell.console("src = " + jsh.shell.jsh.src);

var suite = new jsh.unit.Suite({ name: "fail" });

suite.part("fail", new jsh.unit.part.Html({
	pathname: jsh.script.file.parent.getRelativePath("fail.api.html"),
	reload: true
}));

jsh.unit.interface.create(suite, {
	view: "console"
});
