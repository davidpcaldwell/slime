var parameters = jsh.script.getopts({
	options: {
		rhino: jsh.file.Pathname,
		tomcat: jsh.file.Pathname
	}
});

var SRC = jsh.script.file.parent.parent.parent.parent.parent;

jsh.shell.echo(SRC);

var builds = {};
builds.rhino = function() {
	var environment = {
		//	TODO	One unit test as of this writing requires the PATH environment variable to be defined
		PATH: jsh.shell.environment.PATH,
		JSH_ENGINE: "rhino",
		JSH_BUILD_TOMCAT_HOME: parameters.options.tomcat
	};
	var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.run({
		command: jsh.shell.java.launcher,
		arguments: ["-jar", parameters.options.rhino, "-opt", "-1", SRC.getRelativePath("jsh/etc/unbuilt.rhino.js"), "build", TMP],
		environment: environment
	});
}
var javaCommands = jsh.file.Searchpath([jsh.shell.java.home.getRelativePath("bin")]);
var jjs = javaCommands.getCommand("jjs");
if (jjs) {
	builds.nashorn = function() {
		var environment = {
			PATH: jsh.shell.environment.PATH,
			JSH_ENGINE: "nashorn",
			JSH_BUILD_TOMCAT_HOME: parameters.options.tomcat
		};
		var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
		jsh.shell.run({
			command: jjs,
			arguments: [SRC.getRelativePath("jsh/etc/unbuilt.rhino.js"), "--", "build", TMP],
			environment: environment
		})
	}
}
builds.rhino();
if (builds.nashorn) builds.nashorn();
