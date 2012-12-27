//	This script wraps commands to be executed directly from a SLIME source distribution
//
//	It places the following variables in the scope:
//	SLIME_SRC	A Packages.java.io.File representing the SLIME source root

var SLIME_SRC = (function() {
	//	TODO	could this fail under certain kinds of optimization?
	var frames;
	try {
		throw new Packages.org.mozilla.javascript.WrappedException(Packages.java.lang.RuntimeException());
	} catch (e) {
		debugger;
		var error = e;
		frames = error.getScriptStack();
	}
	//	Packages.java.lang.System.err.println("stack trace length: " + frames.length);
	for (var i=0; i<frames.length; i++) {
		//	Packages.java.lang.System.err.println("stack trace: " + frames[i].fileName);
		var filename = String(frames[i].fileName);
		if (/unbuilt\.rhino\.js/.test(filename)) {
			return new Packages.java.io.File(filename).getCanonicalFile().getParentFile().getParentFile().getParentFile();
		}
	}
	//	TODO	below is included defensively in case some optimizations cause the above to fail
	//	TODO	probably would not work for Cygwin; see below logic from earlier version
//	if (platform.cygwin) {
//		_base = new Packages.java.io.File(platform.cygwin.cygpath.windows(String(env.JSH_SLIME_SRC)));
//	} else {
//		_base = new Packages.java.io.File(String(env.JSH_SLIME_SRC));
//	}
	if (Packages.java.lang.System.getenv("SLIME_SRC")) return new Packages.java.io.File(Packages.java.lang.System.getenv("SLIME_SRC"));
	Packages.java.lang.System.err.println("Could not determine SLIME source location. Probable solutions:");
	Packages.java.lang.System.err.println("* Run Rhino in interpreted mode (try -opt -1 on the command line)");
	Packages.java.lang.System.err.println("* Define the SLIME_SRC environment variable to point to the SLIME source directory.");
	Packages.java.lang.System.exit(1);
})();

Packages.java.lang.System.out.println("SLIME_SRC = " + SLIME_SRC.getCanonicalPath());

if (arguments[0] == "build") {
	arguments.splice(0,1);
	load(new Packages.java.io.File(SLIME_SRC, "jsh/etc/build.rhino.js"));
} else if (arguments[0] == "launch") {
	arguments.splice(0,1);
	load(new Packages.java.io.File(SLIME_SRC, "jsh/launcher/rhino/test/unbuilt.rhino.js"));
} else {
	Packages.java.lang.System.err.println("Usage:");
	Packages.java.lang.System.err.println("unbuilt.rhino.js build <arguments>");
	Packages.java.lang.System.err.println("unbuilt.rhino.js launch <arguments>");
	Packages.java.lang.System.exit(1);
}

if (false) {
	Packages.java.lang.System.out.println("arguments = " + arguments);
}