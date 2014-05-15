var parameters = jsh.script.getopts({
	options: {
		rhino: jsh.file.Pathname,
		tomcat: jsh.file.Pathname
	}
});

var SRC = jsh.script.file.parent.parent.parent.parent.parent;

jsh.shell.echo(SRC);

var build = function(p) {
	var environment = {
		//	TODO	One unit test as of this writing requires the PATH environment variable to be defined
		PATH: jsh.shell.environment.PATH,
		JSH_ENGINE: p.engine,
		JSH_BUILD_TOMCAT_HOME: parameters.options.tomcat
	};
	var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
	var command = p.run({
		script: SRC.getRelativePath("jsh/etc/unbuilt.rhino.js"),
		arguments: ["build",TMP]		
	});
	jsh.shell.run({
		command: command.command,
		arguments: command.arguments,
		environment: environment
	});
	jsh.shell.echo("Successfully built engine: " + p.engine);
}

var builders = {};
if (parameters.options.rhino) {
	builders.rhino = {
		engine: "rhino",
		run: function(p) {
			return {
				command: jsh.shell.java.launcher,
				arguments: ["-jar", parameters.options.rhino, "-opt", "-1", p.script].concat(p.arguments)
			};
		}
	};
}

var javaCommands = jsh.file.Searchpath([jsh.shell.java.home.getRelativePath("bin")]);
var jjs = javaCommands.getCommand("jjs");
if (jjs) {
	builders.nashorn = {
		engine: "nashorn",
		run: function(p) {
			return {
				command: jjs,
				arguments: [p.script,"--"].concat(p.arguments)
			};
		}
	};
}

if (builders.rhino) build(builders.rhino);
if (builders.nashorn) build(builders.nashorn);
