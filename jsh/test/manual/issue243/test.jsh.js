var parameters = jsh.script.getopts({
	options: {
		build: jsh.file.Pathname,
		debug: false
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!parameters.options.build) parameters.options.build = (function() {
	var dir = jsh.shell.TMPDIR.createTemporary({ directory: true });
	var rv = dir.pathname;
	dir.remove();
	return rv;
})();

jsh.shell.jsh({
	script: jsh.shell.jsh.src.getFile("jsh/etc/build.jsh.js"),
	arguments: [parameters.options.build,"-notest","-nodoc"]
});

var built = parameters.options.build.directory;
var environment = (parameters.options.debug) ? { JSH_DEBUG_SCRIPT: "rhino" } : {};
jsh.shell.console("Running unit tests with arguments " + parameters.arguments.join(" ") + " and environment " + JSON.stringify(environment));
jsh.shell.jsh({
	shell: built,
	script: built.getFile("src/jsh/etc/unit.jsh.js"),
	arguments: parameters.arguments,
	environment: jsh.js.Object.set({}, jsh.shell.environment, environment)
});
