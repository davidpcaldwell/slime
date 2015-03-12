var parameters = jsh.script.getopts({
	options: {
		java: jsh.shell.java.home.pathname,
		jsh: (jsh.shell.jsh.home) ? jsh.shell.jsh.home.pathname : jsh.file.Pathname,
		src: jsh.script.file.getRelativePath("../.."),
		debug: false,
		logging: jsh.file.Pathname
	}
});

if (!parameters.options.jsh) {
	parameters.options.jsh = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
	jsh.shell.jrunscript({
		fork: true,
		arguments: [parameters.options.src.directory.getRelativePath("jsh/etc/unbuilt.rhino.js"), "build", parameters.options.jsh],
		environment: jsh.js.Object.set({}, jsh.shell.environment, {
			JSH_BUILD_NOTEST: "true",
			JSH_BUILD_NODOC: "true"
		})
	});
}

//	Unit tests
var modules = eval(parameters.options.src.directory.getFile("jsh/etc/api.js").read(String)).environment("jsh");
modules = jsh.js.Array(modules);
var apiArguments = modules.fold(function(array) {
	if (this.api) array.push("-api",this.path);
	if (this.test) array.push("-test",this.path);
	return array;
},[]);

var subenv = {};
for (var x in jsh.shell.environment) {
	if (!/^JSH_/.test(x)) {
		subenv[x] = jsh.shell.environment[x];
	}
}
var properties = {};
if (parameters.options.logging) {
	properties["java.util.logging.config.file"] = parameters.options.logging.toString();
}

jsh.shell.jsh({
	shell: parameters.options.jsh.directory,
	properties: properties,
	script: parameters.options.src.directory.getRelativePath("jsh/unit/jsapi.jsh.js"),
	arguments: apiArguments,
	environment: subenv
});
