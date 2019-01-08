var destination = jsh.shell.TMPDIR.createTemporary({ directory: true });
var jar = jsh.shell.TMPDIR.createTemporary({ suffix: ".jar" });
jar.remove();
jsh.java.tools.javac({
	destination: destination.pathname,
	arguments: [
		jsh.script.file.parent.getRelativePath("Main.java")
	]
});
jsh.script.file.parent.getSubdirectory("META-INF").copy(destination);
jsh.io.archive.zip.encode({
	stream: jar.pathname.write(jsh.io.Streams.binary),
	entries: destination.list({
		type: destination.list.RESOURCE,
		descendants: function(dir) {
			return true;
		}
	})
});
jsh.shell.console("JAR: " + jar);
jsh.shell.java({
	classpath: jsh.file.Searchpath([
		jar.pathname
	]),
	main: "Main"
});

var loadRunnables = function() {
	var runnableLoader = Packages.java.util.ServiceLoader.load(Packages.java.lang.Runnable.class);
	var rv = [];
	var iterator = runnableLoader.iterator();
	while (iterator.hasNext()) {
		var r = iterator.next();
		rv.push(String(r.getClass().getName()));
//		jsh.shell.echo(r.getClass().getName());
	}
	return rv;
};

jsh.shell.console("Before: " + loadRunnables());
jsh.loader.plugins(jar.pathname);
jsh.shell.console("After: " + loadRunnables());
