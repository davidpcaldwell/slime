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
//	cd /path/to/source; java -jar js.jar jsh/etc/build.jsh.js <arguments>
//
//	The script can be invoked in two ways. The first builds a shell to the given directory:
//	build.jsh.js <build-destination>
//
//	The second builds an executable JAR capable of installing the shell:
//	build.jsh.js -installer <installer-destination>


//	TODO	Eliminate launcher JAR file; seems to be used only for packaging applications now
//	TODO	build script should build all plugins

//	Policy decision to support 1.6 and up
var JAVA_VERSION = "1.6";

jsh.shell.echo("Building jsh with arguments [" + jsh.script.arguments.join(" ") + "]", { stream: jsh.shell.stdio.error });
var parameters = jsh.script.getopts({
	options: {
		verbose: false,
		nounit: false,
		notest: false,
		unit: false,
		test: false,
		nodoc: false,
		rhino: jsh.file.Pathname,
		norhino: false,
		installer: jsh.file.Pathname
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

jsh.script.loader = new jsh.script.Loader("../../");

var jrunscript = (function() {
	var THIS = {};
	THIS.$api = {
		script: (jsh.script.url) ? { url: jsh.script.url } : null,
		arguments: []
	};
	jsh.script.loader.run("rhino/jrunscript/api.js", {}, THIS);
	THIS.$api.arguments = [];
	return THIS;
})();

var build = (function() {
	var bothError = function(name) {
		throw new Error("Specified both -" + name + " and -no" + name + "; specify one or the other.");
	}

	var setBoolean = function(rv,name) {
		if (parameters.options[name] && parameters.options["no" + name]) {
			bothError(name);
		}
		if (parameters.options[name]) rv[name] = true;
		if (parameters.options["no" + name]) rv[name] = false;
	};

	var otherwise = function(o,property,value) {
		if (typeof(o[property]) == "undefined") {
			o[property] = value;
		}
	};

	var rv = {};
	setBoolean(rv,"test");
	setBoolean(rv,"unit");
	if (rv.test === false && typeof(rv.unit) == "undefined") rv.unit = false;
	setBoolean(rv,"doc");
	if (parameters.options.rhino && parameters.options.norhino) {
		bothError("rhino");
	}
	if (parameters.options.rhino) rv.rhino = jsh.file.Searchpath([parameters.options.rhino]);
	if (parameters.options.norhino) rv.rhino = null;

	//	Include Rhino if we are running under it and it is not explicitly excluded
	if (typeof(rv.rhino) == "undefined" && jsh.shell.rhino && jsh.shell.rhino.classpath) {
		rv.rhino = jsh.shell.rhino.classpath;
	}

	var downloadRhino = function() {
		var _file = jrunscript.$api.rhino.download();
		return jsh.file.Searchpath([jsh.file.Pathname(String(_file.getCanonicalPath()))]);
	};

	if (jsh.script.url) {
		otherwise(rv,"unit",false);
		otherwise(rv,"test",false);
		otherwise(rv,"doc",true);
		if (typeof(rv.rhino) == "undefined") {
			rv.rhino = downloadRhino();
		}
	} else if (jsh.script.file) {
		otherwise(rv,"unit",true);
		otherwise(rv,"test",true);
		//	Should the default for doc be false?
		otherwise(rv,"doc",true);
		if (typeof(rv.rhino) == "undefined") {
			if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
				//	do nothing; use Nashorn only
			} else {
				rv.rhino = downloadRhino();
			}
		}
	} else {
		throw new Error();
	}
	return rv;
})();

if (jsh.script.url) {
	//	download source code and relaunch
	//	http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/jsh/etc/build.jsh.js
	var matcher = /^http(s)?\:\/\/bitbucket\.org\/api\/1.0\/repositories\/davidpcaldwell\/slime\/raw\/(.*)\/jsh\/etc\/build.jsh.js$/;
	var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
	if (matcher.exec(jsh.script.url)) {
		var match = matcher.exec(jsh.script.url);
		jrunscript.$api.bitbucket.get({
			protocol: "http" + ((match[1]) ? match[1] : ""),
			revision: match[2],
			destination: tmp.pathname.java.adapt()
		});
		var args = Array.prototype.slice.call(parameters.arguments);
		args.push( (build.unit) ? "-unit" : "-nounit" );
		args.push( (build.test) ? "-test" : "-notest" );
		if (!build.doc) args.push("-nodoc");
		var properties = {};
		if (build.rhino) {
			args.push("-rhino", build.rhino.toString());
			properties["jsh.engine.rhino.classpath"] = String(build.rhino);
		}
		jsh.shell.jsh({
			shell: tmp,
			properties: properties,
			script: tmp.getFile("jsh/etc/build.jsh.js"),
			arguments: args,
			evaluate: function(result) {
				jsh.shell.exit(result.status);
			}
		});
	} else {
		//	TODO	more helpful error message
		jsh.shell.echo("Executing from unknown URL: " + jsh.script.url + " ... cannot locate source distribution for version.");
		jsh.shell.exit(1);
	}
}

var loadLauncherScript = function(name) {
	var argument = (function() {
		if (jsh.script.file) return { file: jsh.script.file.getRelativePath("../../jsh/launcher/" + name).java.adapt() };
		if (jsh.script.url) {
			var _url = new Packages.java.net.URL(jsh.script.url);
			var _resolved = new Packages.java.net.URL(_url, "../../jsh/launcher/" + name);
			return { url: _resolved };
		}
	})();
	jrunscript.$api.script = new jrunscript.$api.Script(argument);
	jsh.script.loader.run("jsh/launcher/" + name, { $api: jrunscript.$api }, jrunscript);
}

loadLauncherScript("slime.js");
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
	return unbuilt.compileLoader({ source: JAVA_VERSION, target: JAVA_VERSION });
}

var console = jrunscript.$api.console;
var debug = jrunscript.$api.debug;

if (parameters.options.verbose) debug.on = true;

var destination = (function(parameters) {
	//	TODO	should normalize Cygwin paths if Cygwin support is added
	var rv;

	var Installer = function(to) {
		this.installer = jsh.file.Pathname(to);
		this.shell = jsh.shell.TMPDIR.createTemporary({ directory: true });
	};

	var Destination = function(to) {
		//	TODO	what should happen if destination directory exists?
		this.shell = jsh.file.Pathname(to).createDirectory({
			ifExists: function(dir) {
				dir.remove();
				return true;
			}
		});
	};

	if (parameters.options.installer) {
		rv = new Installer(parameters.options.installer);
	} else if (parameters.arguments[0]) {
		rv = new Destination(parameters.arguments.shift());
	}

	if (!rv) {
		console("Usage:");
		console(jsh.script.file.pathname.basename + " <build-destination>");
		console("-or-");
		console(jsh.script.file.pathname.basename + " -installer <installer-jar-location>");
		jsh.shell.exit(1);
	} else {
		rv.arguments = parameters.arguments;
		return rv;
	}
})(parameters);

var SLIME = jsh.script.file.parent.parent.parent;

console("Creating directories ...");
["lib","script","script/launcher","modules","src"].forEach(function(path) {
	destination.shell.getRelativePath(path).createDirectory();
});

console("Copying launcher scripts ...");
SLIME.getFile("rhino/jrunscript/api.js").copy(destination.shell.getRelativePath("jsh.js"));
["slime.js","launcher.js","main.js"].forEach(function(name) {
	SLIME.getFile("jsh/launcher/" + name).copy(destination.shell);
});

if (build.rhino) {
	console("Copying Rhino libraries ...");
	//	TODO	if multiple Rhino libraries and none named js.jar, built shell will not use Rhino
	build.rhino.pathnames.forEach( function(pathname,index,array) {
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
	var tmpClasses = jrunscript.launcher.buildLoader(build.rhino);
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
	console("Copying bootstrap scripts ...");
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
		if (build.rhino) {
			files.push.apply(files,build.rhino.pathnames);
		}
		files.push(destination.shell.getRelativePath("lib/jsh.jar"));
		return new jsh.file.Searchpath(files);
	})();
	var module = function(path,compile) {
		var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
		slime.build.jsh(
			SLIME.getSubdirectory(path),
			tmp,
			(compile) ? { source: JAVA_VERSION, target: JAVA_VERSION, classpath: MODULE_CLASSPATH.toString(), nowarn: true, rhino: build.rhino } : null
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
		console("Running post-installer with arguments [" + destination.arguments.join(" ") + "] ... ");
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
	//	TODO	test whether Tomcat tests work in shells where -install tomcat is indicated
	//	TODO	ensure that user plugins are disabled; the below probably does not work. See inonit.jsh.script.Main, which
	//			automatically uses user plugins
	subenv.JSH_PLUGINS = "";
	return subenv;
});

(function() {
	if (build.unit || build.doc) {
		var args = [];
		if (!build.unit) args.push("-notest");
		modules.forEach(function(module) {
			if (module.api) args.push("-api",SLIME.getRelativePath(module.path));
			if (module.test) args.push("-test",SLIME.getRelativePath(module.path));
		});
		if (!parameters.options.nodoc) {
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
	}
	if (build.test) {
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
		].concat( (build.rhino) ? [] : ["-norhino"] )
	});
}