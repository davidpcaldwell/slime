var run = function(command) {
	console(command.join(" "));
	var status = runCommand.apply(this,command);
	if (status != 0) {
		throw new Error("Failed with status: " + status + ": " + command.join(" "));
	} else {
		console("Passed: " + command.join(" "));
	}
}

var getPath = function(basedir,relative) {
	var jfile = new File(basedir,relative);
	var rv = String(jfile.getCanonicalPath());
	if (platform.cygwin) {
		rv = platform.cygwin.cygpath.unix(rv);
	}
	return rv;
}

var tmp = createTemporaryDirectory();
run(LAUNCHER_COMMAND.concat([
	String(new File(BASE,"jsh/tools/slime.jsh")),
	"-from", getPath(BASE,"loader/rhino/test/data/1"),
	"-to", getPath(tmp,"1.slime")
]));

run(LAUNCHER_COMMAND.concat(
	[ 
		String(new File(BASE,"jsh/test/2.jsh.js").getCanonicalPath())
		, { env: { MODULES: tmp.getCanonicalPath() }} 
	]
));

var classes = createTemporaryDirectory();
classes.mkdirs();

console("Compiling AddClasses to: " + classes);
platform.jdk.compile(compileOptions.concat([
	"-d", classes.getCanonicalPath(),
	"-sourcepath", [
		String(new File(BASE,"jsh/test/addClasses/java").getCanonicalPath())
	].join(colon),
	String(new File(BASE,"jsh/test/addClasses/java/test/AddClasses.java").getCanonicalPath())
]));

var classpath = String(classes.getCanonicalPath());
if (platform.cygwin) {
	classpath = platform.cygwin.cygpath.unix(classpath);
}
run(LAUNCHER_COMMAND.concat(
	[
		String(new File(BASE,"jsh/test/addClasses/addClasses.jsh.js").getCanonicalPath())
		,"-classes",classpath
	]
));
