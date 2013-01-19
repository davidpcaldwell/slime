var parameters = jsh.script.getopts({
	options: {
		to: jsh.file.Pathname,
		javassist: jsh.file.Pathname,
		test: String
	}
});

if (!parameters.options.to) {
	parameters.options.to = jsh.shell.TMPDIR.createTemporary({ suffix: ".jar" });
}

var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

var javassist;

if (!parameters.options.javassist) {
	jsh.shell.echo("Required: -javassist");
	jsh.shell.exit(1);
} else {
	javassist = parameters.options.javassist;
}

jsh.java.tools.javac({
	destination: tmp.getRelativePath("classes"),
	classpath: jsh.file.Searchpath([javassist]),
	sourcepath: jsh.file.Searchpath([
		jsh.script.file.getRelativePath("java")
	]),
	arguments: [
		jsh.script.file.getRelativePath("java/inonit/tools/Profiler.java")
	]
});

jsh.java.tools.javac({
	destination: tmp.getRelativePath("test"),
	classpath: jsh.file.Searchpath([]),
	sourcepath: jsh.file.Searchpath([
		jsh.script.file.getRelativePath("java")
	]),
	arguments: [
		jsh.script.file.getRelativePath("java/inonit/tools/Test.java")
	]
})

var jar = jsh.shell.java.home.parent.getFile("bin/jar");

jsh.shell.shell(
	jar.pathname,
	[
		"xf", javassist
	],
	{
		workingDirectory: tmp.getSubdirectory("classes")
	}
);

var manifest = jsh.shell.TMPDIR.createTemporary({ suffix: "mf" });
manifest.pathname.write("Premain-Class: inonit.tools.Profiler\n", { append: false });
jsh.shell.shell(
	jar.pathname,
	[
		"cfm", parameters.options.to,
		manifest,
		//	TODO	should list directory
	].concat(
		tmp.getSubdirectory("classes").list().map(function(node) { return node.pathname.basename })
	),
	{
		workingDirectory: tmp.getSubdirectory("classes")
	}
);

jsh.shell.echo("Created JAR at " + parameters.options.to);

if (parameters.options.test) {
	if (parameters.options.test == "java" || parameters.options.test == "all") {
		jsh.shell.shell(
			jsh.shell.java.home.getFile("bin/java"),
			[
				"-javaagent:" + parameters.options.to,
				"-classpath", tmp.getRelativePath("test"),
				"inonit.tools.Test"
			],
			{
				onExit: function(result) {
					jsh.shell.echo(result.command + " " + result.arguments.join(" "));
					jsh.shell.echo("Exit status: "  + result.status);
				}
			}
		)
	}
	if (parameters.options.test == "script" || parameters.options.test == "all") {
		//	TODO	would be better to use jsh.shell.jsh, but would need to guarantee forking, which upcoming version may not
		jsh.shell.shell(
			jsh.shell.java.home.getFile("bin/java"),
			[
				"-classpath", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
				"inonit.script.jsh.launcher.Main",
				jsh.script.file.getRelativePath("test.jsh.js")
			],
			{
				environment: jsh.js.Object.set({}, jsh.shell.environment, {
					JSH_JVM_OPTIONS: "-javaagent:" + parameters.options.to,
					JSH_SCRIPT_DEBUGGER: "profiler"
				}),
				onExit: function(result) {
					jsh.shell.echo(result.command + " " + result.arguments.join(" "));
					jsh.shell.echo("Exit status: "  + result.status);
				}
			}
		)
	}
}

