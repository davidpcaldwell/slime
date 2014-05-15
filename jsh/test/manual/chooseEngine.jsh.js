//	Expected:
//		JDK 8, -builder nashorn ==> should complete successfully
var parameters = jsh.script.getopts({
	options: {
		builder: String,
		engine: String
	}
});

var javaCommands = jsh.file.Searchpath([jsh.shell.java.home.getRelativePath("bin")]);

var SRC = jsh.script.file.getRelativePath("../../..").directory;

var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });

var unbuiltCommand = SRC.getFile("jsh/etc/unbuilt.rhino.js");

var jjs = javaCommands.getCommand("jjs");

var builders = {};
if (jjs) {
	builders.nashorn = function() {
		jsh.shell.run({
			command: jjs,
			arguments: [unbuiltCommand.toString(), "--", "build", TMP.toString()],
			environment: {
				JSH_BUILD_NOTEST: "true",
				JSH_BUILD_NODOC: "true"
			}
		});
	};
}

builders[parameters.options.builder]();

jsh.shell.run({
	command: jsh.shell.java.launcher,
	arguments: ["-jar", TMP.getRelativePath("jsh.jar"), SRC.getRelativePath("jsh/test/jsh.shell/echo.jsh.js")],
	environment: {
		JSH_ENGINE: parameters.options.engine
	}
});
