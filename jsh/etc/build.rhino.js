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

//	TODO	Eliminate launcher JAR file; seems to be used only for packaging applications now
//	TODO	build script should build all plugins

jsh.script.loader = new jsh.script.Loader("../../");

var jrunscript = (function() {
	var THIS = {};
	jsh.script.loader.run("rhino/jrunscript/api.js", {}, THIS);
	THIS.$api.arguments = jsh.script.arguments;
	return THIS;
})();

var loadLauncherScript = function(name) {
	jrunscript.$api.script = new jrunscript.$api.Script({ file: jsh.script.file.getRelativePath("../../jsh/launcher/" + name).java.adapt() });
	jsh.script.loader.run("jsh/launcher/" + name, { $api: jrunscript.$api }, jrunscript);
}
if (!jrunscript.$api.slime) {
	loadLauncherScript("slime.js");
}
var debug = jrunscript.$api.debug;
loadLauncherScript("launcher.js");
jrunscript.launcher = {};
jrunscript.launcher.buildLoader = function(rhino) {
	//	Converts jsh searchpath to launcher classpath
	var _rhino = (rhino) ? (function() {
		var _urls = rhino.pathnames.map(function(pathname) {
			return pathname.java.adapt().toURI().toURL();
		});
		return _urls;
	})() : null;
	var unbuilt = new jrunscript.$api.jsh.Unbuilt(_rhino);
	return unbuilt.compileLoader();
}
//	TODO	remove this load(); currently this seems to augment the platform object, and may augment the slime object with the
//			ability to build modules
jsh.script.loader.run("jsh/etc/api.rhino.js", { $api: jrunscript.$api, File: Packages.java.io.File }, jrunscript);
//jsh.shell.echo("Platform keys = " + Object.keys(platform));
//$api.script.resolve("api.rhino.js").load();

//	Policy decision to support 1.6 and up
var JAVA_VERSION = "1.6";

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

(function buildLoader() {
	console("Building jsh application ...");
	//	TODO	Do we want to cross-compile against JAVA_VERSION boot classes?
	//	TODO	test coverage for Nashorn
	//	TODO	target/source ignored; -g possibly not present
	//	TODO	May want to emit compiler information when running from build script
	var tmpClasses = jrunscript.launcher.buildLoader(RHINO_LIBRARIES);
	jsh.file.zip({
		//	TODO	still need jsh.file java.adapt()
		from: jsh.file.Pathname( String(tmpClasses.getCanonicalPath()) ).directory,
		to: destination.shell.getRelativePath("lib/jsh.jar")
	});
//	jrunscript.$api.jsh.zip(tmpClasses,new File(JSH_HOME,"lib/jsh.jar"));
})();

console("Building launcher ...");
(function buildLauncher() {
	var _tmp = jrunscript.$api.slime.launcher.compile();
	var tmp = jsh.file.Pathname(String(_tmp.getCanonicalPath())).directory;
	//	TODO	assume manifest uses \n always, does it?
	tmp.getRelativePath("META-INF/MANIFEST.MF").write([
		"Main-Class: inonit.script.jsh.launcher.Main",
		""
	].join("\n"), { append: false, recursive: true });
	jsh.file.zip({
		from: tmp,
		to: destination.shell.getRelativePath("jsh.jar")
	})
})();

(function copyScripts() {
	console("Copying script implementations ...");
	SLIME.getSubdirectory("loader").copy(destination.shell.getRelativePath("script/loader"));
	SLIME.getSubdirectory("jsh/loader").copy(destination.shell.getRelativePath("script/jsh"));
})();

var modules = (function createModules() {
	console("Creating bundled modules ...")
	//	TODO	remove or modify this; appears to redefine the slime global object
	var slime = jsh.script.loader.file("jsh/tools/slime.js").slime;
	//load(String($api.slime.src.getFile("jsh/tools/slime.js").getCanonicalPath()));
	var MODULE_CLASSPATH = (function() {
		var files = [];
		if (RHINO_LIBRARIES) {
			files.push.apply(files,RHINO_LIBRARIES.pathnames);
		}
		files.push(destination.shell.getRelativePath("lib/jsh.jar"));
		return new jsh.file.Searchpath(files);
	})();
	var module = function(path,compile) {
		var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
		slime.build.jsh(
			SLIME.getSubdirectory(path),
			tmp,
			(compile) ? { source: JAVA_VERSION, target: JAVA_VERSION, classpath: MODULE_CLASSPATH.toString(), nowarn: true, rhino: RHINO_LIBRARIES } : null
		);
		var topath = path.replace(/\//g, ".");
		if (topath.substring(topath.length-1) == ".") topath = topath.substring(0,topath.length-1);
		var to = destination.shell.getRelativePath("modules/" + path.replace(/\//g, ".") + "slime");
		jsh.file.zip({
			from: tmp,
			to: to
		});
		console("Created module file: " + to);
	};

	//	TODO	clean up below here
	var modules = eval(SLIME.getFile("jsh/etc/api.js").read(String)).environment("jsh");

	modules.forEach(function(item) {
		if (item.module) {
			module(item.path, item.module.javac);
		}
	});

	return modules;
})();

jsh.shell.echo("Creating plugins directory ...");
destination.shell.getRelativePath("plugins").createDirectory();
//	TODO	it might be useful in the future to copy jsh/loader/plugin.api.html into this directory, to make it easy to find.
//			this would also make it so that an installer would automatically create the plugins directory when unzipping the
//			distribution; right now this is also done in install.jsh.js. But currently, this would mess up the CSS, etc., so it
//			might be better to leave the plugin documentation only in docs/api/
//	copyFile(new File(SLIME_SRC, "jsh/loader/plugin.api.html"))

console("Creating tools ...");
SLIME.getSubdirectory("jsh/tools").copy(destination.shell.getRelativePath("tools"));

console("Creating install scripts ...");
var ETC = destination.shell.getRelativePath("etc").createDirectory();
SLIME.getFile("jsh/etc/install.jsh.js").copy(ETC);
SLIME.getSubdirectory("jsh/etc/install").copy(ETC);

(function copySource() {
	console("Bundling source code ...");
	SLIME.list({
		filter: function(node) {
			return !node.directory;
		},
		descendants: function(directory) {
			if (directory.pathname.basename == ".hg") return false;
			return true;
		},
		type: SLIME.list.ENTRY
	}).forEach(function(entry) {
		//	TODO	need for 'recursive' was not clear from documentation
		entry.node.copy(destination.shell.getRelativePath("src/" + entry.path), { recursive: true });
	});
})();

if (!destination.installer) {
	(function postInstaller() {
		console("Running post-installer with arguments ... " + destination.arguments.join(" "));
		//	TODO	the below kind of manipulation is an excellent category for improved $api
		var subenv = jsh.js.Object.set({}, jsh.shell.environment);
		for (var x in subenv) {
			if (/^JSH_/.test(x)) {
				delete subenv[x];
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
		jsh.shell.jsh({
			shell: destination.shell,
			script: destination.shell.getFile("etc/install.jsh.js"),
			arguments: destination.arguments
		});
	})();
}

var getTestEnvironment = jsh.js.constant(function() {
	var subenv = {};
	for (var x in jsh.shell.environment) {
		if (!/^JSH_/.test(x)) {
			subenv[x] = jsh.shell.environment[x];
		}
	}
	//	TODO	this should not be necessary; built shell should detect Tomcat
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
	return subenv;
});

(function() {
	var nounit = getSetting("jsh.build.nounit") || getSetting("jsh.build.notest");
	var notest = getSetting("jsh.build.notest");
	var nodoc = getSetting("jsh.build.nodoc");
	var args = [];
	if (nounit) args.push("-notest");
	modules.forEach(function(module) {
		if (module.api) args.push("-api",SLIME.getRelativePath(module.path));
		if (module.test) args.push("-test",SLIME.getRelativePath(module.path));
	});
	if (!nodoc) {
		args.push("-doc",destination.shell.getRelativePath("doc/api"));
		args.push("-index",SLIME.getFile("jsh/etc/index.html"));
	}
	console("Running jsapi.jsh.js ...");
	jsh.shell.jsh({
		shell: destination.shell,
		script: SLIME.getFile("jsh/unit/jsapi.jsh.js"),
		arguments: args,
		environment: getTestEnvironment()
	});
	if (!notest) {
		console("Running integration tests ...");
		jsh.shell.jsh({
			shell: destination.shell,
			script: SLIME.getFile("jsh/test/integration.jsh.js"),
			arguments: [],
			environment: getTestEnvironment()
		});
	}
})();

if (destination.installer) {
	//	TODO	allow getting named resource as stream from within jsh
	//	TODO	allow jsh.file.unzip to take a stream as its source
	console("Build installer to " + destination.installer);
	var zipdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
	var build = zipdir.getRelativePath("build.zip");
	console("Build build.zip to " + build);
	jsh.file.zip({
		from: destination.shell,
		to: build
	});
	jsh.shell.jsh({
		shell: destination.shell,
		script: destination.shell.getFile("tools/package.jsh.js"),
		arguments: [
			"-script", destination.shell.getRelativePath("etc/install.jsh.js"),
			"-file", "build.zip=" + build,
			"-to", destination.installer
		].concat( (RHINO_LIBRARIES) ? [] : ["-norhino"] )
	});
}


(function() {
	var $api = jrunscript.$api;
	var JAVA_HOME = jrunscript.JAVA_HOME;
	var platform = jrunscript.platform;

	jrunscript.$api.jsh.zip = function(from,to,filters) {
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


var LAUNCHER_COMMAND = [
	String(jsh.shell.java.jrunscript),
	String(new File(JSH_HOME,"jsh.js").getCanonicalPath())
//	String(new File(JAVA_HOME,"bin/java").getCanonicalPath()),
//	"-jar",String(new File(JSH_HOME,"jsh.jar").getCanonicalPath())
];

var getPath = function(file) {
	var path = String(file.getCanonicalPath());
	if (platform.cygwin) {
		path = platform.cygwin.cygpath.unix(path);
	}
	return path;
};

//var setTestEnvironment = function(command) {
//	command.push({ env: getTestEnvironment() });
//};

//if (!getSetting("jsh.build.notest")) {
//	var integrationTests = function() {
//		var command = LAUNCHER_COMMAND.slice();
//		var script = $api.slime.src.getFile("jsh/test/integration.jsh.js");
//		command.push(getPath(script));
//		setTestEnvironment(command);
//		console("Running integration tests at " + script.getCanonicalPath() + " ...");
//		//	Cannot use load(script.getCanonicalPath()) because errors will not propagate back to this file, so would need to roll
//		//	our own inter-file communication (maybe a global variable). For now, we'll just eval the file.
//		var status = $api.engine.runCommand.apply(this,command);
//		if (status != 0) {
//			throw new Error("Integration tests failed: " + command.join(" "));
//		}
//	}
//
//	integrationTests();
//}
}).call(this);