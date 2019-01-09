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

//	Script to launch a script in an unbuilt jsh. Should be invoked via the jsh/etc/unbuilt.rhino.js tool; see that tool for
//	details

if (!$api.slime) {
	if ($api.script.url) {
		//	Load as-is, I guess?
	} else if ($api.script.file.getParentFile().getName() =="launcher") {
		//	Graal does not currently implement java.lang.String methods on strings
		//	Load as-is
	} else if ($api.script.file.getParentFile().getName().equals("launcher")) {
		//	Load as-is
	} else {
		//	TODO	hard-codes assumption of built shell and hard-codes assumption unbuilt shell will arrive via launcher script; should
		//			tighten this implementation
		$api.slime = {
			built: $api.script.file.getParentFile()
		};
	}
	$api.script.resolve("slime.js").load();
}

$api.debug.on = Boolean($api.slime.settings.get("jsh.launcher.debug"));
$api.debug("Source: " + $api.slime.src);
$api.debug("Bootstrap script: " + $api.script);


//var container = new function() {
//	//	TODO	jsh.tmpdir is not correctly passed to launcher in the forking scenario
//
//	var id = ($api.slime.settings.get("jsh.shell.container")) ? $api.slime.settings.get("jsh.shell.container") : "classloader";
//
//	var vm = [];
//
//	this.argument = function(string) {
//		vm.push(string);
//	}
//
//	if (id == "classloader") {
//		this.getVmArguments = function() {
//			return vm.concat($api.slime.settings.getContainerArguments());
//		};
//
//		this.getLauncherArguments = function() {
//			return [];
//		}
//	} else {
//		this.getVmArguments = function() {
//			return vm.concat($api.slime.settings.getPropertyArguments());
//		};
//
//		this.getLauncherArguments = function() {
//			return vm;
//		}
//	}
//}

//	Add implementation of runCommand that echoes what it's doing to debug log
$api.engine.runCommand = (function(was) {
	return function() {
		$api.debug("main.js Running: " + Array.prototype.slice.call(arguments).join(" "));
		return was.apply(this,arguments);
	}
})($api.engine.runCommand);

//	Supply arguments whose default values are provided by the jrunscript API

//	If Rhino location not specified, and we are running this script inside Rhino, set that to be the default Rhino location for the
//	shell
$api.slime.settings["default"]("jsh.engine.rhino.classpath", $api.rhino.classpath);

//	If SLIME source location not specified, and we can determine it, supply it to the shell
$api.slime.settings["default"]("jsh.shell.src", ($api.slime.src) ? String($api.slime.src) : null);

$api.script.resolve("launcher.js").load();

//	If we have a sibling named jsh.jar, we are a built shell
var shell = (function() {
	if ($api.script.resolve("jsh.jar")) {
		return new $api.jsh.Built($api.script.file.getParentFile());
	} else {
		$api.slime.settings["default"](
			"jsh.shell.lib",
			$api.slime.src.getPath("local/jsh/lib")
		);
		return new $api.jsh.Unbuilt();
	}
})();
$api.debug("shell detected = " + shell);

if (!new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
	delete $api.jsh.engines.nashorn;
}

var defaultEngine = (function() {
	if (shell.rhino) return "rhino";
	if ($api.jsh.engines.nashorn) return "nashorn";
	//	Download Rhino
	//	TODO	documentation appears to be wrong; it warns that if the appropriate engine is not present the shell will not be
	//			run
	$api.console("No default engine; downloading Rhino ...");
	var _file = $api.rhino.download();
	shell.rhino = [_file.toURI().toURL()];
	$api.slime.settings.set("jsh.engine.rhino.classpath", String(_file.getCanonicalPath()));
	return "rhino";
})();
$api.debug("shell after engine selection = " + shell);
if (!defaultEngine) {
	Packages.java.lang.System.err.println("No compatible JavaScript engine found.");
	Packages.java.lang.System.exit(1);
}
$api.slime.settings["default"]("jsh.engine", defaultEngine);

var command = new $api.java.Command();

if ($api.slime.settings.get("jsh.java.home")) {
	command.home(new $api.java.Install(new Packages.java.io.File($api.slime.settings.get("jsh.java.home"))));
}

if ($api.arguments[0] == "-engines") {
	var engines = [];
	if (shell.rhino) engines.push("rhino");
	if ($api.jsh.engines.nashorn) engines.push("nashorn");
	Packages.java.lang.System.out.print(JSON.stringify(engines));
	Packages.java.lang.System.exit(0);
}

//	Read arguments that begin with dash until we find an argument that does not; interpret these as VM switches
while($api.arguments.length > 0 && $api.arguments[0].substring(0,1) == "-") {
	command.vm($api.arguments.shift());
}

var _urls = [];

if (shell.rhino) {
	//	TODO	possibly redundant with some code in launcher.js; examine and think through
	$api.slime.settings.set("jsh.engine.rhino.classpath", new $api.jsh.Classpath(shell.rhino).local());
	for (var i=0; i<shell.rhino.length; i++) {
		_urls.push(shell.rhino[i]);
	}
}

// TODO: currently there is no strategy for handling these options jsh.engine and jsh.debug.script if they conflict
var scriptDebugger = $api.slime.settings.get("jsh.debug.script");
var profilerMatcher =  /^profiler(?:\:(.*))?$/;
if ( profilerMatcher.test(scriptDebugger)) {
	var profilerMatch = profilerMatcher.exec(scriptDebugger);
	if (shell.profiler) {
		if ($api.slime.settings.get("jsh.engine") == "rhino") {
			if (profilerMatch[1]) {
				command.vm("-javaagent:" + shell.profiler + "=" + profilerMatch[1]);
			} else {
				command.vm("-javaagent:" + shell.profiler);
			}
		} else {
			Packages.java.lang.System.err.println("Profiler does not run under Nashorn.");
			Packages.java.lang.System.exit(1);
		}
	} else {
		Packages.java.lang.System.err.println("Could not find profiler.");
		Packages.java.lang.System.exit(1);
	}
} else if (scriptDebugger == "rhino") {
	$api.slime.settings.set("jsh.engine", "rhino");
} else if (scriptDebugger == "ncdbg") {
	$api.slime.settings.set("jsh.engine", "nashorn");
	var ncdbg = (function() {
		if ($api.slime.src) return new $api.slime.src.File("jsh/tools/ncdbg.jsh.js");
		if ($api.slime.home) return new Packages.java.io.File($api.slime.home, "src/jsh/tools/ncdbg.jsh.js");
	})();
	// TODO: command.argument(.../ncdbg.jsh.js)
	command.argument(String(ncdbg.getAbsolutePath()));
//	throw new Error("ncdbg jsh.debug.script not implemented");
} else if (scriptDebugger == "graal") {
	$api.slime.settings.set("jsh.engine", "graal");
	command.argument("--inspect");
}

(function() {
	var container = $api.slime.settings.getContainerArguments();
	for (var i=0; i<container.length; i++) {
		$api.debug("container " + container[i]);
		// TODO: test whether this works for Graal
		command.vm(container[i]);
	}
})();
$api.slime.settings.sendPropertiesTo(command);

var _shellUrls = shell.shellClasspath();
$api.debug("_shellUrls = " + _shellUrls);
for (var i=0; i<_shellUrls.length; i++) {
	_urls.push(_shellUrls[i]);
}
$api.debug("_urls = " + _urls);

//	TODO	document, generalize
if ($api.slime.settings.get("jsh.shell.classpath")) {
	var files = $api.slime.settings.get("jsh.shell.classpath").split(String(Packages.java.io.File.pathSeparator));
	for (var i=0; i<files.length; i++) {
		_urls.push(new Packages.java.io.File(files[i]).toURI().toURL());
	}
}
$api.debug("_urls = " + _urls);

var classpath = new $api.jsh.Classpath(_urls);

var engine = $api.jsh.engines[$api.slime.settings.get("jsh.engine")];
if (!engine) throw new Error("Specified engine not found: " + $api.slime.settings.get("jsh.engine")
	+ " JSH_ENGINE=" + $api.shell.environment.JSH_ENGINE
	+ " jsh.engine=" + Packages.java.lang.System.getProperty("jsh.engine")
	+ " shell=" + shell
);

//	TODO	Are we really using classloader launch under Rhino?
var fork = engine.resolve({
	rhino: false,
	nashorn: true,
	graal: true
});
$api.debug("Fork = " + fork);

if (fork) command.fork();

for (var i=0; i<classpath._urls.length; i++) {
	command.classpath(classpath._urls[i]);
}

command.main(engine.main);

for (var i=0; i<$api.arguments.length; i++) {
	command.argument($api.arguments[i]);
}

//	TODO	try to figure out a way to get rid of HTTP property passthrough; used for testing of HTTP-based launch
//			from Bitbucket
var passthrough = ["http.proxyHost","http.proxyPort","jsh.loader.user","jsh.loader.password"];
for (var i=0; i<passthrough.length; i++) {
	if (Packages.java.lang.System.getProperty(passthrough[i])) {
		command.systemProperty(passthrough[i], Packages.java.lang.System.getProperty(passthrough[i]));
	}
}

$api.debug("command = " + command);
var status = command.run();
//	This basically hard-codes the exit at the VM level, meaning this script cannot be embedded.
$api.debug("exit status = " + status);
if (typeof(status) != "undefined") {
	Packages.java.lang.System.exit(status);
}
