var parameters = jsh.script.getopts({
	options: {
		java: jsh.shell.java.home.pathname,
		jsh: jsh.shell.jsh.home.pathname,
		src: jsh.script.file.getRelativePath("../..")
	}
});

var java = jsh.file.Searchpath([parameters.options.java.directory.getRelativePath("bin")]).getCommand("java");

//	Unit tests
var modules = eval(parameters.options.src.directory.getFile("jsh/etc/api.js").read(String));
modules = jsh.js.Array(modules);
var apiArguments = modules.fold(function(array) {
	array.push("-api",this);
	return array;
},[]);

var subenv = {};
for (var x in jsh.shell.environment) {
	if (!/^JSH_/.test(x)) {
		subenv[x] = jsh.shell.environment[x];
	}
}
//	Provide way to set CATALINA_HOME?
//	Provide way to set JSH_LAUNCHER_DEBUG?
//	Provide way to set JSH_SCRIPT_DEBUGGER?
//	Provide way to set JSH_ENGINE?
jsh.shell.run({
	command: java,
	arguments: [
		"-jar", parameters.options.jsh.directory.getRelativePath("jsh.jar"),
		parameters.options.src.directory.getRelativePath("jsh/unit/jsapi.jsh.js")
	].concat(apiArguments),
	environment: subenv
});

//	TODO	Assumes Rhino-based

var RHINO = parameters.options.jsh.directory.getRelativePath("lib/js.jar");

jsh.shell.run({
	command: java,
	arguments: [
		"-Djsh.home=" + parameters.options.jsh,
		"-Dslime.src=" + parameters.options.src,
		"-jar", parameters.options.jsh.directory.getRelativePath("lib/js.jar"),
		"-e", "var RHINO_LIBRARIES = new Packages.java.io.File('" + RHINO + "')",
		"-f", parameters.options.src.directory.getRelativePath("jsh/launcher/rhino/api.rhino.js"),
		parameters.options.src.directory.getRelativePath("jsh/test/suite.rhino.js")
	]
});
