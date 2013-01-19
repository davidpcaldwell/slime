//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	Build script for jsh
//
//	The best way to execute this script is to execute it in the Rhino shell via the jsh/etc/unbuilt.rhino.js helper script:
//
//	java -jar /path/to/rhino/js.jar /path/to/source/jsh/etc/unbuilt.rhino.js build <arguments>
//
//	It can also be executed directly using the Rhino shell, but it then needs assistance finding the source code, as Rhino scripts
//	do not know their own location. This can be done by changing the working directory to the source root:
//
//	cd /path/to/source; java -jar js.jar jsh/etc/build.rhino.js <arguments>
//
//	The script can be invoked in two ways. The first builds a shell to the given directory:
//	build.rhino.js <build-destination>
//
//	The second builds an executable JAR capable of installing the shell:
//	build.rhino.js -installer <installer-destination>
//
//	System properties that affect the build (equivalent environment variable name in parentheses):
//
//	jsh.build.base (JSH_BUILD_BASE): if not executed via the unbuilt.rhino.js helper script, this setting specifies the directory
//	where the SLIME source distribution can be found; otherwise the current working directory is assumed to be the location of the
//	source distribution
//
//	jsh.build.debug (JSH_BUILD_DEBUG): if set, additional debugging information is emitted to System.err, and the subshell that
//	generates and runs unit tests is run in the debugger
//
//	jsh.build.nounit (JSH_BUILD_NOUNIT): if set, unit tests are not run as part of the build process
//	jsh.build.notest (JSH_BUILD_NOTEST): if set, unit and integration tests are not run as part of the build process
//
//	jsh.build.nodoc (JSH_BUILD_NODOC): if set, no documentation is emitted as part of the build process
//
//	jsh.build.javassist.jar (JSH_BUILD_JAVASSIST_JAR): if set, profiler is built using Javassist.

//	Policy decision to support 1.6 and up
var JAVA_VERSION = "1.6";

var File = Packages.java.io.File;
var System = Packages.java.lang.System;

var zip = function(from,to,filters) {
	if (!filters) filters = [];
	var zstream = new Packages.java.util.zip.ZipOutputStream(new Packages.java.io.FileOutputStream(to));

	var directories = {};

	var createDirectory = function(path) {
		if (path.length == 0) return;
		var tokens = path.split("/");
		for (var i=1; i<tokens.length; i++) {
			var partial = tokens.slice(0,i).join("/");
			if (!directories[partial]) {
				var entry = new Packages.java.util.zip.ZipEntry(partial+"/");
				zstream.putNextEntry(entry);
				zstream.closeEntry();
				directories[partial] = true;
			}
		}
	}

	var process = function(file,prefix,filters) {
		for (var i=0; i<filters.length; i++) {
			if (filters[i].accept(file)) {
				filters[i].process(file,prefix);
				return;
			}
		}

		var nextPrefix = function() {
			if (prefix == "") return "";
			return prefix + "/";
		}

		if (file.isDirectory()) {
			createDirectory(prefix);
			var files = file.listFiles();
			for (var i=0; i<files.length; i++) {
				process(files[i],nextPrefix()+file.getName(),filters);
			}
		} else {
			createDirectory(prefix);
			var entry = new Packages.java.util.zip.ZipEntry(nextPrefix()+file.getName());
			zstream.putNextEntry(entry);
			var i = new Packages.java.io.FileInputStream(file);
			platform.io.copyStream(i,zstream);
			i.close();
			zstream.closeEntry();
		}
	}

	var top = from.listFiles();
	for (var i=0; i<top.length; i++) {
		process(top[i],"",filters);
	}
	zstream.close();
}

var getSetting = function(systemPropertyName) {
	var environmentVariableName = systemPropertyName.replace(/\./g, "_").toUpperCase();
	if (System.getProperty(systemPropertyName)) {
		return String(System.getProperty(systemPropertyName));
	} else if (System.getenv(environmentVariableName)) {
		return String(System.getenv(environmentVariableName));
	} else {
		return null;
	}
}

var SLIME_SRC;
var BASE = (function() {
	if (typeof(SLIME_SRC) != "undefined") return SLIME_SRC;
	return (getSetting("jsh.build.base")) ? new File(getSetting("jsh.build.base")) : new File(System.getProperty("user.dir"));
})();

if (new File(BASE,"jsh/etc/build.rhino.js").exists() && new File(BASE,"jsh/launcher/rhino/api.rhino.js").exists()) {
	load(new File(BASE,"jsh/launcher/rhino/api.rhino.js"));
} else {
	//	TODO	A way to get around this would be to have the Rhino shell somehow make available the location from which
	//			the currently executing script was loaded, and then walk up the source tree to where the root must be; this can
	//			apparently be done in CommonJS mode
	//	TODO	Another way would be to examine the arguments given to js.jar, knowing that this script would be the first
	//			argument and it would tell us the location, but currently we cannot access this
	System.err.println("ERROR: Could not locate source code at: " + BASE.getCanonicalPath());
	System.err.println();
	System.err.println("Either execute this script from the top-level directory of the SLIME source distribution, or specify where");
	System.err.println("the source distribution can be found by setting the jsh.build.base system property. For example:");
	System.err.println();
	System.err.println("cd /path/to/slime/source; java -jar /path/to/rhino/js.jar jsh/etc/build.rhino.js");
	System.err.println();
	System.err.println("or");
	System.err.println();
	System.err.println("java -Djsh.build.base=/path/to/slime/source -jar /path/to/rhino/js.jar /path/to/slime/source/jsh/etc/build.rhino.js");
	System.exit(1);
}

if (getSetting("jsh.build.debug")) debug.on = true;

debug("java.io.tmpdir = " + System.getProperty("java.io.tmpdir"));

if (!platform.jdk.compile) {
	console("Java compiler not found (running in a JRE, rather than a JDK?)");
	console("A Java compiler is required for executing this script.");
	exit(1);
}

var destination = (function() {
	var toNativePath = function(path) {
		if (platform.cygwin) {
			path = platform.cygwin.cygpath.windows(path);
		}
		return path;
	}

	if (arguments[0] == "-installer") {
		return {
			installer: new File(toNativePath(arguments[1])),
			shell: createTemporaryDirectory()
		}
	} else {
		if (arguments.length == 0) {
			console("Usage:");
			console("build.rhino.js <build-destination>");
			console("-or-");
			console("build.rhino.js -installer <installer-jar-location>");
			exit(1);
		}
		return {
			shell: new File(toNativePath(arguments[0]))
		}
	}
}).apply(this,arguments);

var JSH_HOME = destination.shell;
debug("JSH_HOME = " + JSH_HOME.getCanonicalPath());
console("Building to: " + JSH_HOME.getCanonicalPath());

var remove = function(file) {
	if (!file.exists()) return;
	if (file.isDirectory()) {
		var files = file.listFiles();
		for (var i=0; i<files.length; i++) {
			remove(files[i]);
		}
	}
	file["delete"]();
}
remove(JSH_HOME);
JSH_HOME.mkdirs();

var RHINO_HOME = function() {
	//	This strategy for locating Rhino will cause problems if someone were to somehow run against something other than js.jar,
	//	like an un-jarred version
	var url = Packages.java.lang.Class.forName("org.mozilla.javascript.Context").getProtectionDomain().getCodeSource().getLocation().toString();
	var matcher = /^file\:(.*)/;
	if (matcher.exec(url)[1].substring(2,3) == ":") {
		//	this is a windows path of the form /C:/ ...
		return new File(matcher.exec(url)[1].substring(1)).getParentFile();
	} else {
		return new File(matcher.exec(url)[1]).getParentFile();
	}
}();
debug("RHINO_HOME = " + RHINO_HOME.getCanonicalPath());

var RHINO_LIBRARIES = [
	new File(RHINO_HOME,"js.jar")
	//	TODO	Used to allow XMLBeans here if env.XMLBEANS_HOME defined
];

//	TODO	Consider adding XMLBeans back in
/*
#if [ -z "$XMLBEANS_HOME" ]; then
#	echo "No XMLBEANS_HOME specified; not bundling XMLBeans."
#fi
*/

console("Creating directories ...");
["lib","script","script/launcher","modules","src"].forEach(function(path) {
	new File(JSH_HOME,path).mkdir();
});

console("Copying launcher scripts ...");
copyFile(new File(BASE,"jsh/launcher/rhino/api.rhino.js"), new File(JSH_HOME,"script/launcher/api.rhino.js"));
copyFile(new File(BASE,"jsh/launcher/rhino/jsh.rhino.js"), new File(JSH_HOME,"script/launcher/jsh.rhino.js"));

console("Copying libraries ...");
RHINO_LIBRARIES.forEach( function(file) {
	copyFile(file,new File(JSH_HOME,"lib/" + file.getName()));
});

var tmp = createTemporaryDirectory();

var tmpClasses = new File(tmp,"classes");
tmpClasses.mkdir();
var javaSources = [];

var addJavaFiles = function(f) {
	if (f.isDirectory() && f.getName() != ".hg") {
		var files = f.listFiles();
		for (var i=0; i<files.length; i++) {
			addJavaFiles(files[i]);
		}
	} else if (f.getName().endsWith(".java")) {
		javaSources.push(String(f.getCanonicalPath()));
	}
}

console("Building jsh application ...");
addJavaFiles(new File(BASE,"loader/rhino/java"));
addJavaFiles(new File(BASE,"rhino/system/java"));
addJavaFiles(new File(BASE,"jsh/loader/java"));
//	TODO	do we want to cross-compile against JAVA_VERSION boot classes?
var compileOptions = ["-g", "-nowarn", "-target", JAVA_VERSION, "-source", JAVA_VERSION];
var javacArguments = compileOptions.concat([
	"-d", tmpClasses.getCanonicalPath(),
	"-classpath", RHINO_LIBRARIES.map(function(file) { return String(file.getCanonicalPath()); }).join(colon)
]).concat(javaSources);
debug("Compiling: " + javacArguments.join(" "));
platform.jdk.compile(javacArguments);
zip(tmpClasses,new File(JSH_HOME,"lib/jsh.jar"));

console("Building launcher ...");
var tmpLauncher = new File(tmp,"launcher");
tmpLauncher.mkdir();
platform.jdk.compile(compileOptions.concat([
	"-d", tmpLauncher.getCanonicalPath(),
	"-sourcepath", [
		String(new File(BASE,"rhino/system/java").getCanonicalPath())
	].join(colon),
	String(new File(BASE,"jsh/launcher/rhino/java/inonit/script/jsh/launcher/Main.java").getCanonicalPath())
]));
var metainf = new File(tmpLauncher,"META-INF");
metainf.mkdir();
platform.io.write(new File(metainf, "MANIFEST.MF"), function(writer) {
	writer.println("Main-Class: inonit.script.jsh.launcher.Main");
});
//copyFile(new File(BASE,"jsh/launcher/rhino/java/MANIFEST.MF"), new File(metainf, "MANIFEST.MF"));
debug("Launcher compiled to: " + tmpLauncher.getCanonicalPath());
zip(tmpLauncher,new File(JSH_HOME,"jsh.jar"),[]);

console("Copying script implementations ...")
copyFile(new File(BASE,"loader"), new File(JSH_HOME,"script/platform"), [
	{
		accept: function(f) {
			return (f.isDirectory() && f.getName() == ".hg")
				|| (f.isDirectory() && f.getName() == "test")
				|| (f.isDirectory() && f.getName() == "browser")
				|| (f.isDirectory() && f.getName() == "rhino")
				|| (f.isDirectory() && f.getName() == "api")
				|| (f.getName() == "api.html")
			;
		},
		process: function(f,t) {
		}
	}
]);
copyFile(new File(BASE,"loader/rhino"), new File(JSH_HOME,"script/rhino"), [
	{
		accept: function(f) {
			return f.isDirectory() && f.getName() == "test"
				|| f.isDirectory() && f.getName() == "java"
			;
		},
		process: function(f,t) {
		}
	}
]);
copyFile(new File(BASE,"jsh/loader"), new File(JSH_HOME,"script/jsh"), [
	{
		accept: function(f) {
			return f.getName() == "api.html"
				|| f.getName() == "java"
			;
		},
		process: function(f,t) {
		}
	}
]);

console("Creating bundled modules ...")
load(new File(BASE,"jsh/tools/slime.js").getCanonicalPath());
var tmpModules = new File(tmp,"modules");
tmpModules.mkdir();
var module = function(path,compile) {
	var tmp = new File(tmpModules,path);
	tmp.mkdirs();
	slime.build.rhino(new File(BASE,path), tmp, {
		copyFile: copyFile,
		compile: compile
	}, {
		source: JAVA_VERSION,
		target: JAVA_VERSION,
		classpath: new File(RHINO_HOME, "js.jar").getCanonicalPath() + colon + new File(JSH_HOME,"lib/jsh.jar").getCanonicalPath(),
		nowarn: true
	});
	var to = new File(JSH_HOME,"modules/"+path.replace(/\//g, ".")+".slime");
	to.getParentFile().mkdirs();
	zip(tmp,to,[]);
	console("Created module file: " + to.getCanonicalPath());
};

[
	"js/object","js/debug","rhino/host","rhino/io","rhino/file","rhino/shell","jsh/shell","jsh/script","rhino/http/client"
	,"rhino/tools"
].forEach( function(item) {
	module(item,platform.jdk.compile);
});

[
	"rhino/http/servlet"
].forEach( function(item) {
	module(item,function(args) {
		//	do not compile servlet; servlet classes are provided by webapp.jsh.js when building a webapp, and classpath with
		//	servlet API is supplied by invoker
	});
});

console("Creating plugins directory ...");
var JSH_PLUGINS = new File(JSH_HOME,"plugins");
JSH_PLUGINS.mkdir();
//	TODO	it might be useful in the future to copy jsh/loader/plugin.api.html into this directory, to make it easy to find.
//			this would also make it so that an installer would automatically create the plugins directory when unzipping the
//			distribution; right now this is also done in install.jsh.js. But currently, this would mess up the CSS, etc., so it
//			might be better to leave the plugin documentation only in docs/api/
//	copyFile(new File(BASE, "jsh/loader/plugin.api.html"))

var LAUNCHER_COMMAND = [
	String(new File(JAVA_HOME,"bin/java").getCanonicalPath()),
	"-jar",String(new File(JSH_HOME,"jsh.jar").getCanonicalPath())
];

if ((getSetting("jsh.build.nounit") || getSetting("jsh.build.notest")) && getSetting("jsh.build.nodoc")) {
} else {
	console("Running JSAPI ...");
	var jsapi_jsh = (function() {
		var command = LAUNCHER_COMMAND.slice(0,LAUNCHER_COMMAND.length);
		debug("Launcher command: " + command);
		command.add = function() {
			for (var i=0; i<arguments.length; i++) {
				this.push(arguments[i]);
			}
		}
		command.add("jsh/unit/jsapi.jsh.js");
		var JSH_JSAPI_BASE = String(BASE.getCanonicalPath());
		if (platform.cygwin) {
			JSH_JSAPI_BASE = platform.cygwin.cygpath.unix(JSH_JSAPI_BASE);
		}
		if (getSetting("jsh.build.nounit") || getSetting("jsh.build.notest")) {
			command.add("-notest");
		}
		command.add("-jsapi",JSH_JSAPI_BASE+"/"+"loader/api");
		command.add("-base", JSH_JSAPI_BASE);

		var modules = [];
		modules.add = function(path,ns) {
			var namespace = (ns) ? ns : "";
			this.push(namespace+"@"+path);
		}
		modules.add("jsh/launcher/rhino/", "(launcher)");
		modules.add("jsh/loader/plugin.api.html", "(plugins)");
		modules.add("jsh/tools/", "(tools)");
		modules.add("jsh/loader/","jsh.loader");
		modules.add("loader/");
		modules.add("loader/rhino/");
		modules.add("js/object/","jsh.js");
		modules.add("rhino/host/","jsh.java");
		modules.add("rhino/io/", "jsh.io");
		modules.add("rhino/file/","jsh.file");
		modules.add("rhino/http/client/", "jsh.http")
		modules.add("rhino/shell/");
		modules.add("jsh/shell/","jsh.shell");
		modules.add("jsh/script/","jsh.script");

		modules.forEach( function(module) {
			command.add("-module",module);
		});

		var JSAPI_DOC = String(new File(JSH_HOME,"doc/api").getCanonicalPath());
		if (platform.cygwin) {
			JSAPI_DOC = platform.cygwin.cygpath.unix(JSAPI_DOC);
		}
		if (getSetting("jsh.build.nodoc")) {
		} else {
			command.add("-doc",JSAPI_DOC);
		}

		var subenv = {};
		for (var x in env) {
			if (!/^JSH_/.test(x)) {
				subenv[x] = env[x];
			}
		}
		if (env.JSH_BUILD_DEBUG) {
			subenv.JSH_LAUNCHER_DEBUG = "true";
			subenv.JSH_SCRIPT_DEBUGGER = "rhino";
		}
		command.add({
			env: subenv
		});

		debug("jsapi.jsh.js command: " + command.join(" "));
		var status = runCommand.apply(this,command);
		if (status) {
			throw new Error("Failed: " + command.join(" "));
		}
	})();
}

console("Creating tools ...");
var JSH_TOOLS = new File(JSH_HOME,"tools");
JSH_TOOLS.mkdir();
copyFile(new File(BASE,"jsh/tools"),JSH_TOOLS);

var getPath = function(file) {
	var path = String(file.getCanonicalPath());
	if (platform.cygwin) {
		path = platform.cygwin.cygpath.unix(path);
	}
	return path;
};

if (getSetting("jsh.build.javassist.jar")) {
	(function() {
		console("Building profiler to " + getPath(new File(JSH_HOME,"tools/profiler.jar")) + " ...");
		var command = LAUNCHER_COMMAND.slice(0);
		command.push(getPath(new File(BASE, "rhino/tools/profiler/build.jsh.js")));
		command.push("-javassist", getPath(new File(getSetting("jsh.build.javassist.jar"))));
		command.push("-to", getPath(new File(JSH_HOME,"tools/profiler.jar")));
		var status = runCommand.apply(this,command);
		if (status != 0) {
			throw new Error("Exit status when building profile: " + status);
		}
		new File(JSH_HOME,"tools/profiler/viewer").mkdirs();
		copyFile(new File(BASE,"rhino/tools/profiler/viewer"), new File(JSH_HOME,"tools/profiler/viewer"));
	}).call(this);
} else {
	console("Javassist location not specified; not building profiler.");
}

if (!getSetting("jsh.build.notest")) {
	var integrationTests = function() {
		var script = new File(BASE,"jsh/test/suite.rhino.js");
		console("Running integration tests at " + script.getCanonicalPath() + " ...");
		//	Cannot use load(script.getCanonicalPath()) because errors will not propagate back to this file, so would need to roll
		//	our own inter-file communication (maybe a global variable). For now, we'll just eval the file.
		eval(readFile(script.getCanonicalPath()));
	}

	integrationTests();
}

console("Creating install script ...");
new File(JSH_HOME,"etc").mkdir();
copyFile(new File(BASE,"jsh/etc/install.jsh.js"), new File(JSH_HOME, "etc/install.jsh.js"));

var bases = ["js","loader","rhino","jsh"];

var JSH_SRC = new File(JSH_HOME,"src");
console("Bundling source code ...");
JSH_SRC.mkdir();
bases.forEach( function(base) {
	copyFile(new File(BASE,base), new File(JSH_SRC,base), [
		{
			accept: function(f) {
				return f.isDirectory() && f.getName() == ".hg";
			},
			process: function(f,t) {
			}
		}
	]);
});

if (destination.installer) {
	//	TODO	allow getting named resource as stream from within jsh
	//	TODO	allow jsh.file.unzip to take a stream as its source
	console("Build installer to " + destination.installer);
	var zipdir = createTemporaryDirectory();
	var build = new File(zipdir,"build.zip");
	console("Build build.zip to " + build.getCanonicalPath());
	zip(JSH_HOME,build);

	var command = LAUNCHER_COMMAND.slice(0);
	command.push(getPath(new File(JSH_HOME,"tools/package.jsh.js")));
	command.push("-script",getPath(new File(JSH_HOME,"etc/install.jsh.js")));
	command.push("-file","build.zip=" + getPath(build));
	command.push("-to",getPath(destination.installer));
	runCommand.apply(this,command);
}