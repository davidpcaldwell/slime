var parameters = jsh.script.getopts({
	options: {
		src: jsh.script.file.getRelativePath("../src"),
		install: jsh.script.file.getRelativePath(".."),
		unix: false,
		cygwin: false
	}
});

var which = function(command,extension) {
	//	Search the path for a given command
	if (!extension) extension = "";
	for (var i=0; i<jsh.shell.PATH.pathnames.length; i++) {
		var dir = jsh.shell.PATH.pathnames[i].directory;
		if (dir) {
			if (dir.getFile(command+extension)) {
				return dir.getFile(command+extension);
			}
		} else {
			//	jsh.shell.echo("Not a directory: " + jsh.shell.PATH.pathnames[i]);
		}
	}
	return null;
}

var EXTENSION = (parameters.options.cygwin) ? ".exe" : "";
var src = parameters.options.src.directory;
var install = parameters.options.install.directory;

if (parameters.options.unix) {
	var bash = which("bash",EXTENSION);
	if (bash) {
		var code = src.getFile("jsh/launcher/rhino/jsh.bash").read(String);
		var lines = code.split("\n");
		var path = bash.parent.getRelativePath("bash").toString();
		var rewritten = ["#!" + path].concat(lines).join("\n");
		install.getRelativePath("jsh.bash").write(rewritten, { append: false });
	//	copyFile(new File(BASE,"jsh/launcher/rhino/jsh.bash"), new File(JSH_HOME,"jsh.bash"));
	//	var path = String(new File(JSH_HOME,"jsh.bash").getCanonicalPath());
	//	if (platform.cygwin) {
	//		path = platform.cygwin.cygpath.unix(path);
	//	}
		var chmod = which("chmod",EXTENSION);
		jsh.shell.shell(
			chmod.pathname,
			[
				"+x", install.getRelativePath("jsh.bash")
			]
		);
		jsh.shell.echo("Created bash launcher at " + install.getRelativePath("jsh.bash") + " using bash at " + bash);
	} else {
		jsh.shell.echo("bash not found.");
	}
}

if (parameters.options.cygwin) {
	var gplusplus = which("g++",EXTENSION);
	if (gplusplus) {
		jsh.shell.echo("Creating cygwin paths helper ...");
		install.getRelativePath("bin").createDirectory();
		jsh.shell.shell(
			gplusplus.pathname,
			[
				"-o", install.getRelativePath("bin/inonit.script.runtime.io.cygwin.cygpath.exe"),
				src.getRelativePath("rhino/file/java/inonit/script/runtime/io/cygwin/cygpath.cpp")
			]
		);
		jsh.shell.echo("Cygwin paths helper written to " + install.getRelativePath("bin"));
	} else {
		jsh.shell.echo("g++ not found; not building Cygwin paths helper.");
	}
}

if (parameters.options.cygwin) {
	//	TODO	use LoadLibrary call to locate jvm.dll
	//			embed path of jvm.dll in C program, possibly, or load from registry, or ...
	var bash = which("bash",EXTENSION);
	if (bash) {
		var env = jsh.js.Object.set({}, jsh.shell.environment, {
			//	We assume we are running in a JDK, so the java.home is [jdk]/jre, so we look at parent
			//	TODO	improve this check
			JAVA_HOME: jsh.shell.java.home.parent.pathname.toString(),
			TMP: jsh.shell.TMP.pathname.toString(),
			TO: install.pathname.toString()
		});
		jsh.shell.echo("Building Cygwin native launcher with environment " + jsh.js.toLiteral(env));
		jsh.shell.shell(
			bash.pathname,
			[
				src.getRelativePath("jsh/launcher/rhino/native/win32/cygwin.bash")
			],
			{
				environment: env
			}
		);
	} else {
		jsh.shell.echo("bash not found on Cygwin; not building native launcher.");
	}
} else if (parameters.options.unix) {
	var gcc = which("gcc");
	var unix = (function() {
		if (jsh.shell.os.name == "FreeBSD") {
			return {
				include: "freebsd",
				library: "jre/lib/" + jsh.shell.os.arch + "/client"
			}
		} else {
			throw new Error("Unknown OS: " + jsh.shell.os.name);
		}
	})();
	if (gcc) {
		//	Assume we are running in JRE
		var jdk = jsh.shell.java.home.parent;
		jsh.shell.shell(
			gcc.pathname,
			[
				"-o", "jsh",
				"-I" + jdk.getRelativePath("include").toString(),
				"-I" + jdk.getRelativePath("include/" + unix.include).toString(),
				"src/jsh/launcher/rhino/native/jsh.c",
				"-L" + jdk.getRelativePath(unix.library).toString(),
				"-l" + "jvm",
				"-rpath", jdk.getRelativePath(unix.library).toString()
			],
			{
				workingDirectory: install,
				onExit: function(result) {
					if (result.status == 0) {
						jsh.shell.echo("Built native launcher to " + install.getRelativePath("jsh"));
					} else {
						throw new Error("Failed to build native launcher.");
					}
				}
			}
		);
	}
}
