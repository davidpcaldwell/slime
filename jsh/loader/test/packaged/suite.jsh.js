var parameters = jsh.script.getopts({
	options: {
		classes: jsh.file.Pathname,
		view: "console"
	}
});

var src = jsh.script.file.parent.parent.parent.parent.parent;

var classes = (parameters.options.classes) ? parameters.options.classes.directory : null;
if (!classes) {
	// TODO: Not DRY; this code is also in jsh/loader/loader.api.html
	classes = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.console("Compiling AddClasses ...");
	jsh.java.tools.javac({
		destination: classes.pathname,
		sourcepath: jsh.file.Searchpath([src.getRelativePath("jsh/loader/test/addClasses/java")]),
		arguments: [src.getRelativePath("jsh/loader/test/addClasses/java/test/AddClasses.java")]
	});
}

var RHINO_LIBRARIES = (jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function") ? [jsh.shell.jsh.lib.getRelativePath("js.jar").java.adapt()] : null;

//	TODO	there is an undocumented API for this now
var LINE_SEPARATOR = String(Packages.java.lang.System.getProperty("line.separator"));

jsh.shell.console("src = " + src);
var definition = jsh.script.loader.value("suite.js", {
	src: src,
	RHINO_LIBRARIES: RHINO_LIBRARIES,
	LINE_SEPARATOR: LINE_SEPARATOR,
	getClasses: function() {
		return classes;
	}
});

var suite = new jsh.unit.Suite(definition);

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
