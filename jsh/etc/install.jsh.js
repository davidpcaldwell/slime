//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	this should not depend on source directory, should it? On the other hand, we need to bundle the launcher C source and
//			related files ...
//	TODO	remove obsolete command-line options unix, cygwin, src
var parameters = jsh.script.getopts({
	options: {
		//	First two arguments are for the installer case, specifying directory in which to create the shell
		to: jsh.file.Pathname,
		replace: false,

		//	Below arguments are for post-installation: can be run from build script, by themselves post-installation, or when
		//	installer is run
		//
		//	(optional) Describes location of source code; allows running post-installation on a shell that did not have source
		//	code included in build
		src: jsh.file.Pathname,

		//	TODO	-unix and -cygwin cannot be turned off currently; if unspecified and autodetected, they will be added anyway
		unix: false,
		cygwin: false,
		executable: false,
		install: jsh.script.getopts.ARRAY(String)
	}
});

var zip = (jsh.script.loader.resource) ? jsh.script.loader.resource("build.zip") : null;

if (!parameters.options.to && zip) {
	jsh.shell.echo("Usage: " + jsh.script.file.pathname.basename + " -to <destination> [-replace] [-executable]");
	jsh.shell.echo("If <destination> does not exist, it will be created, recursively if necessary.");
	jsh.shell.echo("If <destination> does exist, -replace will overwrite it; otherwise, the installation will abort.");
	jsh.shell.echo("-executable will attempt to create a native executable launcher program at <destination>/jsh");
	//	TODO	what if it exists and is an ordinary file?
	//	TODO	if it is a symlink to a directory with -replace, the symlink *target* will be removed ... and then what will happen?
	//	TODO	if it is a symlink to a non-existent directory, what will happen?
	jsh.shell.exit(1);
} else if (!parameters.options.to && !zip) {
	jsh.shell.echo("Doing post-installation for shell at " + jsh.shell.jsh.home);
} else {
	jsh.shell.echo("Installing to: " + parameters.options.to);
}

var realpath = function(pathname) {
	//	TODO	is this really the simplest way to do this?
	if (!pathname) throw new Error("pathname is " + pathname);
	return jsh.file.filesystem.java.adapt(pathname.java.adapt());
}

var destinationIsSoftlink = function() {
	jsh.shell.echo(parameters.options.to.toString() + " detected as a softlink to " + realpath(parameters.options.to));
	jsh.shell.echo("Please remove the softlink manually, or reference " + realpath(parameters.options.to) + " directly.");
	jsh.shell.exit(1);
}

if (
	parameters.options.to
	&& realpath(parameters.options.to).toString() != parameters.options.to.toString()
	&& realpath(parameters.options.to.parent).toString() == parameters.options.to.parent.toString()
) {
	destinationIsSoftlink();
}

var install;
if (zip) {
	install = parameters.options.to.createDirectory({
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
		zip: zip.read(jsh.io.Streams.binary),
		to: install
	});
} else {
	install = jsh.shell.jsh.home;
}

var which = function(command) {
	return jsh.shell.PATH.getCommand(command);
}

//	TODO	Is this the best way to detect UNIX? We later use the jsh.shell.os.name property, but do we want to try a list of
//			UNIXes and check that property for them?
var uname = which("uname");
if (uname) {
	jsh.shell.echo("Detected UNIX-like operating system.");
	parameters.options.unix = true;
	//	Re-use the detection logic that jsh uses for Cygwin, although this leaves it opaque in this script exactly how we are doing
	//	it; we could run the uname we just found, or even check for its .exe extension
	if (jsh.file.filesystems.cygwin) {
		jsh.shell.echo("Detected Cygwin.");
		parameters.options.cygwin = true;
	}
} else {
	parameters.options.unix = false;
	parameters.options.cygwin = false;
	jsh.shell.echo("Did not detect UNIX-like operating system using PATH: " + jsh.shell.PATH);
}

var src = (parameters.options.src) ? parameters.options.src.directory : install.getSubdirectory("src");

var ISSUE_200_FIXED = false;

if (parameters.options.unix) {
	var bash = which("bash");
	if (ISSUE_200_FIXED && bash) {
		var code = src.getFile("jsh/launcher/jsh.bash").read(String);
		var lines = code.split("\n");
		var path = bash.parent.getRelativePath("bash").toString();
		var rewritten = ["#!" + path].concat(lines).join("\n");
		install.getRelativePath("jsh.bash").write(rewritten, { append: false });
		var chmod = which("chmod");
		jsh.shell.shell(
			chmod,
			[
				"+x", install.getRelativePath("jsh.bash")
			]
		);
		jsh.shell.echo("Created bash launcher at " + install.getRelativePath("jsh.bash") + " using bash at " + bash);
	} else if (!ISSUE_200_FIXED) {
		jsh.shell.echo("bash launcher disabled; see https://bitbucket.org/davidpcaldwell/slime/issues/200");
	} else {
		jsh.shell.echo("bash not found in " + jsh.shell.PATH);
	}
}

//	Build Cygwin paths helper
if (parameters.options.cygwin) {
	var gplusplus = which("g++");
	if (gplusplus) {
		jsh.shell.echo("Creating cygwin paths helper ...");
		install.getRelativePath("bin").createDirectory();
		jsh.shell.shell(
			gplusplus,
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

var ISSUE_201_FIXED = true;

//	Build native launcher
//	TODO	re-enable native launcher for new jrunscript launcher
if (ISSUE_201_FIXED && parameters.options.executable) {
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
				bash,
				[
					src.getRelativePath("jsh/launcher/native/win32/cygwin.bash")
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
		if (gcc) {
			var args = ["-o", "jsh"];
			args.push(src.getRelativePath("jsh/launcher/native/jsh.c"));
			jsh.shell.echo("Invoking gcc " + args.join(" ") + " ...");
			jsh.shell.shell(
				gcc,
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
	} else {
		jsh.shell.echo("Did not detect UNIX-like operating system (detected " + jsh.shell.os.name + "); not building native launcher.");
		jsh.shell.exit(1);
	}
} else if (parameters.options.executable) {
	jsh.shell.echo("Creation of native launcher disabled; see https://bitbucket.org/davidpcaldwell/slime/issues/201");
	jsh.shell.exit(1);
}

//	TODO	run test cases given in jsh.c

//	TODO	if on UNIX-based system, could do more to build convenience scripts that either include shebangs or launch with bash
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
					arguments.callee.chmod,
					[
						"+x", node.pathname.toString()
					]
				);
			}
		}
	};

	if (false) makeExecutable(install.getSubdirectory("tools"));
}

parameters.options.install.forEach(function(name) {
	jsh.shell.jsh({
		fork: true,
//		jar: install.getFile("jsh.jar"),
		script: install.getFile("etc/install/" + name + ".jsh.js")
//		arguments: [install.getRelativePath("etc/install/" + name + ".jsh.js")]
	});
});
