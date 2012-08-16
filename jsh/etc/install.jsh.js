//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	this should not depend on source directory, should it? On the other hand, we need to bundle the launcher C source and
//			related files ...
//	TODO	remove obsolete command-line options unix, cygwin, src
var parameters = jsh.script.getopts({
	options: {
		src: jsh.file.Pathname,
		to: jsh.file.Pathname,
		replace: false,
		unix: false,
		cygwin: false
	}
});

if (!parameters.options.to) {
	jsh.shell.echo("Usage: " + jsh.script.file.pathname.basename + " -to <destination> [-replace]");
	jsh.shell.echo("If <destination> does not exist, it will be created, recursively if necessary.");
	jsh.shell.echo("If <destination> does exist, -replace will overwrite it; otherwise, the installation will abort.");
	//	TODO	what if it exists and is an ordinary file?
	//	TODO	if it is a symlink to a directory with -replace, the symlink *target* will be removed ... and then what will happen?
	//	TODO	if it is a symlink to a non-existent directory, what will happen?
	jsh.shell.exit(1);
}

var file = jsh.script.loader.resource("build.zip");
var realpath = function(pathname) {
	return new jsh.file.filesystem.$jsh.Pathname(pathname.java.adapt());
}

var destinationIsSoftlink = function() {
	jsh.shell.echo(parameters.options.to.toString() + " detected as a softlink to " + realpath(parameters.options.to));
	jsh.shell.echo("Please remove the softlink manually, or reference " + realpath(parameters.options.to) + " directly.");
	jsh.shell.exit(1);
}

if (
	realpath(parameters.options.to).toString() != parameters.options.to.toString()
	&& realpath(parameters.options.to.parent).toString() == parameters.options.to.parent.toString()
) {
	destinationIsSoftlink();
}

var install = parameters.options.to.createDirectory({
	ifExists: function(dir) {
		if (parameters.options.replace) {
			if (
				realpath(parameters.options.to).toString() != parameters.options.to.toString()
				&& realpath(parameters.options.to.parent).toString() == parameters.options.to.parent.toString()

			) {
				//	softlink; currently unreachable as all softlinks are captured above, but in the future we may need to capture
				//	them here
				destinationIsSoftlink();
			} else {
				dir.remove();
				return true;
			}
		} else {
			//	TODO	for symlink to file, dir.toString() does not work. Why?
			var type = (parameters.options.to.file) ? "File" : "Directory";
			jsh.shell.echo(type + " found at " + parameters.options.to);
			jsh.shell.echo("Use -replace to overwrite it.");
			jsh.shell.exit(1);
		}
	},
	recursive: true
});
jsh.file.unzip({
	zip: file,
	to: install
});
//	TODO	remove build.zip

var which = function(command) {
	if (arguments.length > 1) throw new RangeError("Too many arguments.");
	//	Search the path for a given command
	for (var i=0; i<jsh.shell.PATH.pathnames.length; i++) {
		var dir = jsh.shell.PATH.pathnames[i].directory;
		if (dir) {
			//	TODO	generalize extensions
			if (dir.getFile(command)) {
				return dir.getFile(command);
			}
			if (dir.getFile(command + ".exe")) {
				return dir.getFile(command + ".exe");
			}
		} else {
			//	jsh.shell.echo("Not a directory: " + jsh.shell.PATH.pathnames[i]);
		}
	}
	return null;
}

//	TODO	Is this the best way to detect UNIX? We later use the jsh.shell.os.name property, but do we want to try a list of
//			UNIXes and check that property for them?
var uname = which("uname");
if (uname) {
	parameters.options.unix = true;
	//	Re-use the detection logic that jsh uses for Cygwin, although this leaves it opaque in this script exactly how we are doing
	//	it; we could run the uname we just found, or even check for its .exe extension
	if (jsh.file.filesystems.cygwin) {
		parameters.options.cygwin = true;
	}
}

if (!parameters.options.src) {
	parameters.options.src = install.getRelativePath("src");
}
var src = parameters.options.src.directory;

if (parameters.options.unix) {
	var bash = which("bash");
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
		var chmod = which("chmod");
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
	var gplusplus = which("g++");
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
	var bash = which("bash");
	if (bash) {
		var env = jsh.js.Object.set({}, jsh.shell.environment, {
			//	We assume we are running in a JDK, so the java.home is [jdk]/jre, so we look at parent
			//	TODO	improve this check
			JAVA_HOME: jsh.shell.java.home.parent.pathname.toString(),
			LIB_TMP: jsh.shell.TMPDIR.pathname.toString(),
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
	if (!gcc) {
		jsh.shell.echo("Cannot find gcc in PATH; not building native launcher.");
	}
	var unix = (function() {
		var jdk = jsh.shell.java.home.parent;
		if (jsh.shell.os.name == "FreeBSD") {
			return {
				include: [
					jdk.getRelativePath("include"),
					jdk.getRelativePath("include/freebsd")
				],
				library: {
					name: "jvm",
					path: jdk.getRelativePath("jre/lib/" + jsh.shell.os.arch + "/client")
				},
				rpath: true
			}
		} else if (jsh.shell.os.name == "Mac OS X") {
			return {
				include: [
					"/System/Library/Frameworks/JavaVM.framework/Versions/Current/Headers"
				],
				library: {
					command: ["-framework", "JavaVM"]
				}
			}
		} else {
			jsh.shell.echo("Unsupported Unix-like OS: " + jsh.shell.os.name + "; not building native launcher.");
		}
	})();
	if (gcc && unix) {
		//	Assume we are running in JRE
		//	Mac OS X:
		//	gcc -o core/jsh -I/System/Library/Frameworks/JavaVM.framework/Versions/A/Headers
		//		core/src/jsh/launcher/rhino/native/jsh.c
		//		-framework JavaVM
		var args = ["-o", "jsh"];
		unix.include.forEach(function(directory) {
			args.push("-I" + directory);
		});
		args.push("src/jsh/launcher/rhino/native/jsh.c");
		if (unix.library.path && unix.library.name) {
			args.push("-L" + unix.library.path);
			args.push("-l" + unix.library.name);
		} else if (unix.library.command) {
			args.push.apply(args, unix.library.command);
		}
		if (unix.rpath) {
			args.push("-rpath", unix.library.path);
		}
		jsh.shell.echo("Invoking gcc " + args.join(" ") + " ...");
		jsh.shell.shell(
			gcc.pathname,
			args,
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

//	TODO	run test cases given in jsh.c

if (which("chmod")) {
	var makeExecutable = function(node) {
		if (!arguments.callee.chmod) {
			arguments.callee.chmod = which("chmod");
		}
		var recurse = arguments.callee;
		if (node.directory) {
			node.list().forEach(function(item) {
				recurse(item);
			});
		} else {
			if (/\.jsh\.js$/.test(node.pathname.basename)) {
				jsh.shell.echo("Making executable: " + node.pathname.toString());
				jsh.shell.shell(
					arguments.callee.chmod.pathname,
					[
						"+x", node.pathname.toString()
					]
				);
			}
		}
	};

	makeExecutable(install.getSubdirectory("tools"));
}