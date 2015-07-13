//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	Build script for jsh
//
//	The best way to execute this script is to execute it in the Rhino shell via the jsh/etc/unbuilt.rhino.js helper script:
//
//	java -jar /path/to/rhino/js.jar -opt -1 /path/to/source/jsh/etc/unbuilt.rhino.js build <arguments>
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
//	jsh.build.tomcat.home (JSH_BUILD_TOMCAT_HOME): if set, allows HTTP client and server tests to be run
//	jsh.build.notest (JSH_BUILD_NOTEST): if set, unit and integration tests are not run as part of the build process
//
//	jsh.build.nodoc (JSH_BUILD_NODOC): if set, no documentation is emitted as part of the build process
//
//	jsh.build.javassist.jar (JSH_BUILD_JAVASSIST_JAR): if set, profiler is built using Javassist.

jsh.script.loader = new jsh.script.Loader("../../");

var jrunscript = (function() {
	var THIS = {};
	jsh.script.loader.run("rhino/jrunscript/api.js", {}, THIS);
	THIS.$api.arguments = jsh.script.arguments;
	return THIS;
})();
if (!jrunscript.$api.slime) {
//	jsh.shell.echo("io = " + THIS.$api.io);
	jrunscript.$api.script = new jrunscript.$api.Script({ file: jsh.script.file.getRelativePath("../../jsh/launcher/slime.js").java.adapt() });
	jsh.script.loader.run("jsh/launcher/slime.js", { $api: jrunscript.$api }, jrunscript);
//	jsh.shell.echo("slime = " + THIS.$api.slime);
//	jsh.shell.echo("slime = " + Object.keys(THIS.$api.slime));
}
//	TODO	remove this load(); currently this seems to augment the platform object, and may augment the slime object with the
//			ability to build modules
jsh.script.loader.run("jsh/etc/api.rhino.js", { $api: jrunscript.$api, File: Packages.java.io.File }, jrunscript);
//jsh.shell.echo("Platform keys = " + Object.keys(platform));
//$api.script.resolve("api.rhino.js").load();

//	Policy decision to support 1.6 and up
var JAVA_VERSION = "1.6";

var debug = jrunscript.$api.debug;
var console = jrunscript.$api.console;

var getSetting = function(systemPropertyName) {
	//	TODO	switch to superior jsh APIs for this
	var environmentVariableName = systemPropertyName.replace(/\./g, "_").toUpperCase();
	if (Packages.java.lang.System.getProperty(systemPropertyName)) {
		return String(Packages.java.lang.System.getProperty(systemPropertyName));
	} else if (Packages.java.lang.System.getenv(environmentVariableName)) {
		return String(Packages.java.lang.System.getenv(environmentVariableName));
	} else {
		return null;
	}
}

if (getSetting("jsh.build.debug")) debug.on = true;

var destination = (function(args) {
	//	TODO	should normalize Cygwin paths if Cygwin support is added
	var rv;

	var Installer = function(to) {
		this.installer = jsh.file.Pathname(to);
		this.shell = jsh.shell.TMPDIR.createTemporary({ directory: true });
		this.arguments = [];
	};

	var Destination = function(to) {
		//	TODO	what should happen if destination directory exists?
		this.shell = jsh.file.Pathname(to).createDirectory({
			ifExists: function(dir) {
				dir.remove();
				return true;
			}
		});
		this.arguments = [];
	};


	for (var i=0; i<args.length; i++) {
		if (!rv && args[i] == "-installer") {
			rv = new Installer(args[++i]);
		} else if (!rv) {
			rv = new Destination(args[i]);
		} else {
			rv.arguments.push(args[i]);
		}
	}

	if (!rv) {
		console("Usage:");
		console("build.rhino.js <build-destination>");
		console("-or-");
		console("build.rhino.js -installer <installer-jar-location>");
		jsh.shell.exit(1);
	} else {
		return rv;
	}
})(jrunscript.$api.arguments);

var SLIME = jsh.script.file.parent.parent.parent;

var RHINO_LIBRARIES = (function() {
	//	TODO	figure out test coverage here
	if (getSetting("jsh.build.rhino.jar")) {
		return jsh.file.Searchpath([ jsh.file.Pathname(getSetting("jsh.build.rhino.jar")) ]);
	}
	if (getSetting("jsh.engine.rhino.classpath")) {
		//	TODO	assumes only one path component
		return jsh.file.Searchpath([ jsh.file.Pathname(getSetting("jsh.engine.rhino.classpath")) ]);
	}
	if (typeof(Packages.org.mozilla.javascript.Context) == "function") {
		//	TODO	Used to allow XMLBeans here if jsh.shell.environment.XMLBEANS_HOME defined
		return (function() {
			//	This strategy for locating Rhino will cause problems if someone were to somehow run against something other than js.jar,
			//	like an un-jarred version
			var _uri = Packages.java.lang.Class.forName("org.mozilla.javascript.Context").getProtectionDomain().getCodeSource().getLocation().toURI();
			return jsh.file.Searchpath([ String(new Packages.java.io.File(_uri).getCanonicalPath()) ]);
		})();
	}
})();

console("Creating directories ...");
["lib","script","script/launcher","modules","src"].forEach(function(path) {
	destination.shell.getRelativePath(path).createDirectory();
});

console("Copying launcher scripts ...");
SLIME.getFile("rhino/jrunscript/api.js").copy(destination.shell.getRelativePath("jsh.js"));
["slime.js","launcher.js","main.js"].forEach(function(name) {
	SLIME.getFile("jsh/launcher/" + name).copy(destination.shell);
});

if (RHINO_LIBRARIES) {
	console("Copying Rhino libraries ...");
	//	TODO	if multiple Rhino libraries and none named js.jar, built shell will not use Rhino
	RHINO_LIBRARIES.pathnames.forEach( function(pathname,index,array) {
		var name = (array.length == 1) ? "js.jar" : pathname.basename;
		pathname.file.copy(destination.shell.getSubdirectory("lib").getRelativePath(name));
	});
} else {
	console("Rhino libraries not present; building for Nashorn only.");
}

(function() {
	var $api = jrunscript.$api;
	var JAVA_HOME = jrunscript.JAVA_HOME;
	var platform = jrunscript.platform;

	jrunscript.$api.jsh = new function() {
		this.zip = function(from,to,filters) {
			if (!filters) filters = [];
			var zstream = new Packages.java.util.zip.ZipOutputStream(new Packages.java.io.FileOutputStream(to));

			var directories = {};

			var createDirectoryEntry = function(partial) {
				if (!directories[partial]) {
					var entry = new Packages.java.util.zip.ZipEntry(partial+"/");
					zstream.putNextEntry(entry);
					zstream.closeEntry();
					directories[partial] = true;
				}
			}

			var createDirectory = function(path) {
				if (path.length == 0) return;
				var tokens = path.split("/");
				for (var i=1; i<tokens.length; i++) {
					var partial = tokens.slice(0,i).join("/");
					createDirectoryEntry(partial);
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
					if (!directories[nextPrefix()+file.getName()]) {
						createDirectoryEntry(nextPrefix()+file.getName())
					}
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
		};
	}
var colon = String(Packages.java.io.File.pathSeparator);
var File = Packages.java.io.File;
var System = Packages.java.lang.System;

debug("java.io.tmpdir = " + System.getProperty("java.io.tmpdir"));

if (!platform.jdk.compile) {
	console("Java compiler not found (running in a JRE, rather than a JDK?)");
	console("A Java compiler is required for executing this script.");
	System.exit(1);
}

var JSH_HOME = destination.shell.pathname.java.adapt();
debug("JSH_HOME = " + JSH_HOME.getCanonicalPath());
console("Building to: " + JSH_HOME.getCanonicalPath());

//	TODO	Consider adding XMLBeans back in
/*
#if [ -z "$XMLBEANS_HOME" ]; then
#	echo "No XMLBEANS_HOME specified; not bundling XMLBeans."
#fi
*/

var tmp = platform.io.createTemporaryDirectory();

var tmpClasses = new File(tmp,"classes");
tmpClasses.mkdir();
var javaSources = [];

console("Building jsh application ...");
$api.slime.src.getSourceFilesUnder($api.slime.src.getFile("loader/rhino/java"),javaSources);
if (RHINO_LIBRARIES) {
	$api.slime.src.getSourceFilesUnder($api.slime.src.getFile("loader/rhino/rhino/java"),javaSources);
}
$api.slime.src.getSourceFilesUnder($api.slime.src.getFile("rhino/system/java"),javaSources);
$api.slime.src.getSourceFilesUnder($api.slime.src.getFile("jsh/loader/java"),javaSources);
if (RHINO_LIBRARIES) {
	$api.slime.src.getSourceFilesUnder($api.slime.src.getFile("jsh/loader/rhino/java"),javaSources);
}
//	TODO	do we want to cross-compile against JAVA_VERSION boot classes?
var compileOptions = ["-g", "-nowarn", "-target", JAVA_VERSION, "-source", JAVA_VERSION];
//	TODO	test coverage for Nashorn
var JSH_CLASSPATH = (RHINO_LIBRARIES) ? RHINO_LIBRARIES.toString() : "";
var javacArguments = compileOptions.concat([
	"-d", tmpClasses.getCanonicalPath(),
	"-classpath", JSH_CLASSPATH
]).concat(javaSources);
debug("Compiling: " + javacArguments.join(" "));
platform.jdk.compile(javacArguments);
jrunscript.$api.jsh.zip(tmpClasses,new File(JSH_HOME,"lib/jsh.jar"));

console("Building launcher ...");
var tmpLauncher = new File(tmp,"launcher");
tmpLauncher.mkdir();
$api.slime.launcher.compile({ to: tmpLauncher.getCanonicalPath() });
var metainf = new File(tmpLauncher,"META-INF");
metainf.mkdir();
platform.io.write(new File(metainf, "MANIFEST.MF"), function(writer) {
	writer.println("Main-Class: inonit.script.jsh.launcher.Main");
});
debug("Launcher compiled to: " + tmpLauncher.getCanonicalPath());
jrunscript.$api.jsh.zip(tmpLauncher,new File(JSH_HOME,"jsh.jar"),[]);

console("Copying script implementations ...")
platform.io.copyFile($api.slime.src.getFile("loader"), new File(JSH_HOME,"script/loader"), [
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
platform.io.copyFile($api.slime.src.getFile("loader/rhino"), new File(JSH_HOME,"script/loader/rhino"), [
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
platform.io.copyFile($api.slime.src.getFile("jsh/loader"), new File(JSH_HOME,"script/jsh"), [
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
//	TODO	remove or modify this; appears to redefine the slime global object
var slime = jsh.script.loader.file("jsh/tools/slime.js").slime;
//load(String($api.slime.src.getFile("jsh/tools/slime.js").getCanonicalPath()));
var tmpModules = new File(tmp,"modules");
tmpModules.mkdir();
var MODULE_CLASSPATH = (function() {
	var files = [];
	if (RHINO_LIBRARIES) {
		files = files.concat(RHINO_LIBRARIES.pathnames.map(function(pathname) { return pathname.java.adapt(); }));
	}
	files.push(new File(JSH_HOME,"lib/jsh.jar"));
	return files.map(function(_file) {
		return _file.getCanonicalPath();
	}).join(colon);
})();
var module = function(path,compile) {
	var tmp = new File(tmpModules,path);
	tmp.mkdirs();
	slime.build.rhino($api.slime.src.getFile(path), tmp, {
		copyFile: platform.io.copyFile,
		compile: compile
	}, {
		source: JAVA_VERSION,
		target: JAVA_VERSION,
		classpath: MODULE_CLASSPATH,
		nowarn: true,
		rhino: RHINO_LIBRARIES
	});
	var topath = path.replace(/\//g, ".");
	if (topath.substring(topath.length-1) == ".") topath = topath.substring(0,topath.length-1);
	var to = new File(JSH_HOME,"modules/"+topath+".slime");
	to.getParentFile().mkdirs();
	jrunscript.$api.jsh.zip(tmp,to,[]);
	console("Created module file: " + to.getCanonicalPath());
};

var modules = eval($api.engine.readFile($api.slime.src.getFile("jsh/etc/api.js"))).environment("jsh");

modules.forEach(function(item) {
	if (item.module) {
		module(item.path, (item.module.javac) ? platform.jdk.compile : function(args) {});
	}
});

//[
//	"js/object","js/mime","js/debug","rhino/host","rhino/io","js/document","rhino/document","rhino/file","rhino/shell",/*"jsh/shell",*/"jsh/script","rhino/http/client"
//	,"rhino/tools"/*,"rhino/mail"*/
//].forEach( function(item) {
//	module(item,platform.jdk.compile);
//});
//
//[
//	"rhino/http/servlet"
//].forEach( function(item) {
//	module(item,function(args) {
//		//	do not compile servlet; servlet classes are provided by webapp.jsh.js when building a webapp, and classpath with
//		//	servlet API is supplied by invoker
//	});
//});

console("Creating plugins directory ...");
var JSH_PLUGINS = new File(JSH_HOME,"plugins");
JSH_PLUGINS.mkdir();
//	TODO	it might be useful in the future to copy jsh/loader/plugin.api.html into this directory, to make it easy to find.
//			this would also make it so that an installer would automatically create the plugins directory when unzipping the
//			distribution; right now this is also done in install.jsh.js. But currently, this would mess up the CSS, etc., so it
//			might be better to leave the plugin documentation only in docs/api/
//	copyFile(new File(SLIME_SRC, "jsh/loader/plugin.api.html"))

var LAUNCHER_COMMAND = [
	String(jsh.shell.java.jrunscript),
	String(new File(JSH_HOME,"jsh.js").getCanonicalPath())
//	String(new File(JAVA_HOME,"bin/java").getCanonicalPath()),
//	"-jar",String(new File(JSH_HOME,"jsh.jar").getCanonicalPath())
];

console("Creating tools ...");
var JSH_TOOLS = new File(JSH_HOME,"tools");
JSH_TOOLS.mkdir();
platform.io.copyFile($api.slime.src.getFile("jsh/tools"),JSH_TOOLS);

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
		command.push(getPath($api.slime.src.getFile("rhino/tools/profiler/build.jsh.js")));
		command.push("-javassist", getPath(new File(getSetting("jsh.build.javassist.jar"))));
		command.push("-to", getPath(new File(JSH_HOME,"tools/profiler.jar")));
		var subenv = {};
		for (var x in jsh.shell.environment) {
			subenv[x] = jsh.shell.environment[x];
		}
		subenv.JSH_PLUGINS = "";
		command.push({
			env: subenv
		});
		var status = runCommand.apply(this,command);
		if (status != 0) {
			throw new Error("Exit status when building profile: " + status);
		}
		new File(JSH_HOME,"tools/profiler/viewer").mkdirs();
		platform.io.copyFile(slime.src.getFile("rhino/tools/profiler/viewer"), new File(JSH_HOME,"tools/profiler/viewer"));
	}).call(this);
} else {
	debug("Javassist location not specified; not building profiler.");
}

if (getSetting("jsh.build.coffeescript.path")) {
	console("Copying CoffeeScript from " + getSetting("jsh.build.coffeescript.path") + " ...");
	platform.io.copyFile(new File(getSetting("jsh.build.coffeescript.path")), new File(JSH_HOME,"plugins/coffee-script.js"));
} else {
	debug("CoffeeScript location not specified; not including CoffeeScript.");
}

console("Creating install scripts ...");
new File(JSH_HOME,"etc").mkdir();
platform.io.copyFile($api.slime.src.getFile("jsh/etc/install.jsh.js"), new File(JSH_HOME, "etc/install.jsh.js"));
platform.io.copyFile($api.slime.src.getFile("jsh/etc/install"), new File(JSH_HOME, "etc/install"));

var JSH_SRC = new File(JSH_HOME,"src");
console("Bundling source code ...");
JSH_SRC.mkdir();

["js","loader","rhino","jsh"].forEach( function(base) {
	platform.io.copyFile($api.slime.src.getFile(base), new File(JSH_SRC,base), [
		{
			accept: function(f) {
				return f.isDirectory() && f.getName() == ".hg";
			},
			process: function(f,t) {
			}
		}
	]);
});

if (!destination.installer) {
	console("Running post-installer ... " + destination.arguments.join(" "));
//	var command = LAUNCHER_COMMAND.slice();
	var command = [];
	//	TODO	brittle; should improve when this becomes jsh script
	command.push(getPath(new File(JAVA_HOME,"../bin/jrunscript")));
	command.push(new File(JSH_HOME,"jsh.js"));
	command.push(getPath(new File(JSH_HOME,"etc/install.jsh.js")));
	command = command.concat(destination.arguments);
	var subenv = {};
	for (var x in jsh.shell.environment) {
		if (!/^JSH_/.test(x)) {
			subenv[x] = jsh.shell.environment[x];
		}
	}
	if (getSetting("jsh.build.downloads")) {
		subenv.JSH_BUILD_DOWNLOADS = getSetting("jsh.build.downloads");
	}
	if (getSetting("jsh.build.rhino.jar")) {
		subenv.JSH_ENGINE_RHINO_CLASSPATH = getSetting("jsh.build.rhino.jar");
	} else if (getSetting("jsh.engine.rhino.classpath")) {
		subenv.JSH_ENGINE_RHINO_CLASSPATH = getSetting("jsh.engine.rhino.classpath");
	}
//	subenv.JSH_SLIME_SRC = slime.src.toString();
	command.push({ env: subenv });
	var status = $api.engine.runCommand.apply(this,command);
	if (status != 0) {
		throw new Error("Exit status " + status + " from " + command.slice(0,-1).join(" "));
	}
}

var setTestEnvironment = function(command) {
	var subenv = {};
	for (var x in jsh.shell.environment) {
		if (!/^JSH_/.test(x)) {
			subenv[x] = jsh.shell.environment[x];
		}
	}
	if (getSetting("jsh.build.tomcat.home")) {
		//	TODO	is this the best way to do it? Or would simply adding CATALINA_HOME to the environment cause the jsh.httpd
		//			plugin to do this for us?
		subenv.CATALINA_HOME = getSetting("jsh.build.tomcat.home");
	} else {
		console("Tomcat not found (use environment variable JSH_BUILD_TOMCAT_HOME or system property jsh.build.tomcat.home)");
		console("Tests for HTTP client and server will not be run.");
	}
	if (jsh.shell.environment.JSH_BUILD_DEBUG) {
		subenv.JSH_LAUNCHER_DEBUG = "true";
		subenv.JSH_SCRIPT_DEBUGGER = "rhino";
	}
	if (jsh.shell.environment.JSH_ENGINE) {
		subenv.JSH_ENGINE = jsh.shell.environment.JSH_ENGINE;
	}
	subenv.JSH_PLUGINS = "";
	command.push({
		env: subenv
	});
}
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
		command.add($api.slime.src.getFile("jsh/unit/jsapi.jsh.js").getCanonicalPath());
		var JSH_JSAPI_BASE = $api.slime.src.toString();
		if (platform.cygwin) {
			JSH_JSAPI_BASE = platform.cygwin.cygpath.unix(JSH_JSAPI_BASE);
		}
		if (getSetting("jsh.build.nounit") || getSetting("jsh.build.notest")) {
			command.add("-notest");
		}
		command.add("-jsapi",JSH_JSAPI_BASE+"/"+"loader/api");
		command.add("-base", JSH_JSAPI_BASE);

		modules.forEach( function(module) {
			if (module.api) command.add("-api",String($api.slime.src.getFile(module.path).getCanonicalPath()));
			if (module.test) command.add("-test",String($api.slime.src.getFile(module.path).getCanonicalPath()));
		});

		var JSAPI_DOC = String(new File(JSH_HOME,"doc/api").getCanonicalPath());
		if (platform.cygwin) {
			JSAPI_DOC = platform.cygwin.cygpath.unix(JSAPI_DOC);
		}
		if (getSetting("jsh.build.nodoc")) {
		} else {
			command.add("-doc",JSAPI_DOC);
			command.add("-index", String($api.slime.src.getFile("jsh/etc/index.html").getCanonicalPath()));
		}

		setTestEnvironment(command);

		console("JSAPI command:");
		console(command.map(function(item) {
			if (item.env) return "";
			var token = String(item);
			if (token.indexOf("(") != -1) return "\"" + token + "\"";
			return token;
		}).join(" "));
		console("JSAPI environment:");
		console(JSON.stringify(command[command.length-1].env));
		var status = $api.engine.runCommand.apply(this,command);
		if (status) {
			throw new Error("Failed: " + command.join(" "));
		}
	})();
}

if (!getSetting("jsh.build.notest")) {
	var integrationTests = function() {
		var command = LAUNCHER_COMMAND.slice();
		var script = $api.slime.src.getFile("jsh/test/integration.jsh.js");
		command.push(getPath(script));
		setTestEnvironment(command);
		console("Running integration tests at " + script.getCanonicalPath() + " ...");
		//	Cannot use load(script.getCanonicalPath()) because errors will not propagate back to this file, so would need to roll
		//	our own inter-file communication (maybe a global variable). For now, we'll just eval the file.
		var status = $api.engine.runCommand.apply(this,command);
		if (status != 0) {
			throw new Error("Integration tests failed: " + command.join(" "));
		}
	}

	integrationTests();
}

if (destination.installer) {
	//	TODO	allow getting named resource as stream from within jsh
	//	TODO	allow jsh.file.unzip to take a stream as its source
	console("Build installer to " + destination.installer);
	var zipdir = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.java.adapt();
	var build = new File(zipdir,"build.zip");
	console("Build build.zip to " + build.getCanonicalPath());
	jrunscript.$api.jsh.zip(JSH_HOME,build);

	var command = LAUNCHER_COMMAND.slice(0);
	command.push(getPath(new File(JSH_HOME,"tools/package.jsh.js")));
	command.push("-script",getPath(new File(JSH_HOME,"etc/install.jsh.js")));
	command.push("-file","build.zip=" + getPath(build));
	command.push("-to",String(destination.installer));
	if (!RHINO_LIBRARIES) {
		command.push("-norhino");
	}
	$api.engine.runCommand.apply(this,command);
}
}).call(this);
