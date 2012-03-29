var log = function(string) {
	jsh.shell.echo(string, {
		stream: jsh.io.Streams.stderr
	});
}

//	TODO	could more robustly check values below; this pretty much just outputs them and makes sure the appropriate parent objects
//			exist
log("TMP = " + jsh.shell.TMP);
log("USER = " + jsh.shell.USER);
log("PWD = " + jsh.shell.PWD);
log("HOME = " + jsh.shell.HOME);
log("PATH = " + jsh.shell.PATH);
log("os.name = " + jsh.shell.os.name);
log("os.arch = " + jsh.shell.os.arch);
log("os.version = " + jsh.shell.os.version);
log("java.home = " + jsh.shell.java.home);
log("java.version = " + jsh.shell.java.version);
log("java.vendor = " + jsh.shell.java.vendor);
log("java.vendor.url = " + jsh.shell.java.vendor.url);
log("java.vm.specification.version = " + jsh.shell.java.vm.specification.version);
log("java.vm.specification.vendor = " + jsh.shell.java.vm.specification.vendor);
log("java.vm.specification.name = " + jsh.shell.java.vm.specification.name);
log("java.vm.version = " + jsh.shell.java.vm.version);
log("java.vm.vendor = " + jsh.shell.java.vm.vendor);
log("java.vm.name = " + jsh.shell.java.vm.name);
log("java.specification.version = " + jsh.shell.java.specification.version);
log("java.specification.vendor = " + jsh.shell.java.specification.vendor);
log("java.specification.name = " + jsh.shell.java.specification.name);
log("java.class.version = " + jsh.shell.java["class"].version);
log("java.class.path = " + jsh.shell.java["class"].path);
log("java.library.path = " + jsh.shell.java.library.path);
log("java.compiler = " + jsh.shell.java.compiler);
log("java.ext.dirs = " + jsh.shell.java.ext.dirs);

if (typeof(jsh.shell.PATH) == "undefined") {
	throw new Error("PATH should be defined.");
}
if (typeof(jsh.shell.environment.PATH) == "undefined") {
	if (jsh.shell.PATH.pathnames.length > 0) {
		throw new Error("PATH should be empty.");
	}
}
jsh.shell.echo("Passed.");
