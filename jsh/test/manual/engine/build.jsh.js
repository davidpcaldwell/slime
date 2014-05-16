var parameters = jsh.script.getopts({
	options: {
		rhino: jsh.file.Pathname,
		tomcat: jsh.file.Pathname,
		installer: false,
		debug: false
	}
});

var SRC = jsh.script.file.parent.parent.parent.parent.parent;

jsh.shell.echo(SRC);

var build = function(p) {
	var environment = {
		//	TODO	One unit test as of this writing requires the PATH environment variable to be defined
		PATH: jsh.shell.environment.PATH,
		JSH_ENGINE: p.engine,
		JSH_BUILD_TOMCAT_HOME: parameters.options.tomcat,
		JSH_BUILD_DEBUG: (parameters.options.debug) ? "true" : ""
	};
	var destination = (p.installer) ? jsh.shell.TMPDIR.createTemporary({ prefix: "jsh-install.", suffix: ".jar" }) : jsh.shell.TMPDIR.createTemporary({ directory: true });
	var buildargs = (p.installer) ? ["-installer", destination] : [destination];
	var command = p.run({
		script: SRC.getRelativePath("jsh/etc/unbuilt.rhino.js"),
		arguments: ["build"].concat(buildargs)		
	});
	jsh.shell.run({
		command: command.command,
		arguments: command.arguments,
		environment: environment
	});
	jsh.shell.echo("Successfully built engine: " + p.engine + " to " + destination);
	return destination;
}

var engines = {};
if (parameters.options.rhino) {
	engines.rhino = {
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
	engines.nashorn = {
		engine: "nashorn",
		run: function(p) {
			return {
				command: jjs,
				arguments: [p.script,"--"].concat(p.arguments)
			};
		}
	};
};

var install = function(p) {
	var to = build(jsh.js.Object.set({}, p, { installer: true }));
	var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
	TMP.remove();
	jsh.shell.run({
		command: jsh.shell.java.launcher,
		arguments: ["-jar", to, "-to", TMP]
	});
	jsh.shell.run({
		command: jsh.shell.java.launcher,
		arguments: ["-jar", TMP.getRelativePath("jsh.jar"), TMP.getRelativePath("src/jsh/test/jsh.shell/properties.jsh.js")]
	});
}

if (parameters.options.installer) {
	if (engines.rhino) install(engines.rhino);
	if (engines.nashorn) install(engines.nashorn);
} else {
	if (engines.rhino) build(engines.rhino);
	if (engines.nashorn) build(engines.nashorn);
}
