var parameters = jsh.script.getopts({
    options: {
        part: String,
        view: "console"
    }
});

var suite = new jsh.unit.html.Suite();

suite.add("module", new jsh.unit.html.Part({
    pathname: jsh.script.file.parent.parent.getRelativePath("api.html")
}));

jsh.unit.html.cli({
    suite: suite,
    part: parameters.options.part,
    view: parameters.options.view
});
