var parameters = jsh.script.getopts({
	options: {
		packaged: false,
		launcherDebug: false
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

var JSH_HOME = jsh.shell.TMPDIR.createTemporary({ directory: true });
//	TODO	locate jrunscript using Java home
//	TODO	add these APIs for properties, etc., to jsh.shell.jrunscript
var args = [];
//				if (parameters.options.rhino) {
//					args.push("-Djsh.build.rhino.jar=" + parameters.options.rhino);
//				} else if (Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath")) {
//					args.push("-Djsh.engine.rhino.classpath=" + Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath"));
//				}
var SLIME = jsh.shell.jsh.src;
args.push(SLIME.getRelativePath("rhino/jrunscript/api.js"));
args.push("jsh");
args.push(SLIME.getRelativePath("jsh/etc/build.jsh.js"));
args.push(JSH_HOME);
args.push("-notest");
args.push("-nodoc");
// TODO: Rhino; other parameters jsh/test/plugin.jsh.js
jsh.shell.run({
	command: jsh.shell.java.jrunscript,
	arguments: args
});

var environment = Object.assign({}, jsh.shell.environment, (parameters.options.launcherDebug) ? {"JSH_LAUNCHER_DEBUG": "true"}: {});
if (!parameters.options.packaged) {
	jsh.shell.run({
		command: jsh.shell.java.jrunscript,
		arguments: (function() {
			var rv = [];
			rv.push(JSH_HOME.getFile("jsh.js"));
			rv.push.apply(rv,parameters.arguments);
			return rv;
		})(),
		environment: environment
	});
} else {
	var to = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("packaged.jar");
	var script = parameters.arguments.shift();
	jsh.shell.jsh({
		shell: JSH_HOME,
		script: jsh.shell.jsh.src.getRelativePath("jsh/tools/package.jsh.js"),
		arguments: ([
			"-script", script,
			"-to", to
		]).concat( (!rhino) ? ["-norhino"] : [] )
	});
	jsh.shell.java({
		jar: to.file,
		arguments: parameters.arguments,
		environment: environment
	});
}
