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

var env = $api.shell.environment;

if (!$api.slime) {
	if ($api.script.url) {
		//	Load as-is, I guess?
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

//	First, we want to process VM-level arguments. In the current jsh, the script-executing VM might be the launcher VM, if
//	jsh.shell.container is classloader, or a forked loader VM, if it is jvm. So we process VM-level arguments using an object that
//	encapsulates the difference and applies the VM-level arguments to the script-executing VM

var container = new function() {
	//	TODO	jsh.tmpdir is not correctly passed to launcher in the forking scenario

	var id = ($api.slime.settings.get("jsh.shell.container")) ? $api.slime.settings.get("jsh.shell.container") : "classloader";

	var vm = [];

	this.argument = function(string) {
		vm.push(string);
	}

	if (id == "classloader") {
		this.getVmArguments = function() {
			return vm.concat($api.slime.settings.getContainerArguments());
		};

		this.getLauncherArguments = function() {
			return [];
		}
	} else {
		this.getVmArguments = function() {
			return vm.concat($api.slime.settings.getPropertyArguments());
		};

		this.getLauncherArguments = function() {
			return vm;
		}
	}
}

//	Add implementation of runCommand that echoes what it's doing
$api.engine.runCommand = (function(was) {
	return function() {
		$api.debug("main.js Running: " + Array.prototype.slice.call(arguments).join(" "));
		return was.apply(this,arguments);
	}
})($api.engine.runCommand);

//	Supply arguments whose default values are provided by the jrunscript API

//	If Rhino location not specified, and we are running this script inside Rhino, we supply its classpath to the shell
$api.slime.settings.default("jsh.engine.rhino.classpath", $api.rhino.classpath);

//	If SLIME source location not specified, and we can determine it, supply it to the shell
$api.slime.settings.default("jsh.shell.src", ($api.slime.src) ? String($api.slime.src) : null);

//	Read arguments that begin with dash until we find an argument that does not; interpret these as VM switches
while($api.arguments.length > 0 && $api.arguments[0].substring(0,1) == "-") {
	container.argument($api.arguments.shift());
}

var install = (function() {
	if ($api.slime.settings.get("jsh.java.home")) {
		return new $api.java.Install(new Packages.java.io.File($api.slime.settings.get("jsh.java.home")));
	}
	return $api.java.install;
})();

//	TODO	convert to use $api.java.Command
//	TODO	under various circumstances, we could execute this without forking a VM; basically, if args.vm.length == 0 we could
//			instead create a classloader using $api.slime.launcher.getClasses() and call main() on inonit.script.jsh.launcher.Main
$api.script.resolve("launcher.js").load();
var command = new $api.java.Command();
//	TODO	determine whether forking can be removed. Right now, the problem is that in subshells the appropriate classes
//			cannot be found, apparently
command.fork();
if ($api.slime.settings.get("jsh.java.home")) {
	command.home(new $api.java.Install(new Packages.java.io.File($api.slime.settings.get("jsh.java.home"))));
}
var vm = container.getVmArguments();
for (var i=0; i<vm.length; i++) {
	command.vm(vm[i]);
}
//	If we have a sibling named jsh.jar, we are a built shell
var shell = (function() {
	if ($api.script.resolve("jsh.jar")) {
		return new $api.jsh.Built($api.script.file.getParentFile());
	} else {
		var rhino;
		var HOME = new Packages.java.io.File(Packages.java.lang.System.getProperty("user.home"));
		if ($api.slime.settings.get("jsh.engine.rhino.classpath")) {
			rhino = [new Packages.java.io.File($api.slime.settings.get("jsh.engine.rhino.classpath")).toURI().toURL()];
		} else if (new Packages.java.io.File(HOME, ".inonit/jsh/lib/js.jar").exists()) {
			rhino = [new Packages.java.io.File(HOME, ".inonit/jsh/lib/js.jar")];
		} else {
			$api.debug("No setting for jsh.engine.rhino.classpath");
		}
		return new $api.jsh.Unbuilt(rhino);
	}
})();
$api.debug("shell = " + shell);
if (!new javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
	delete $api.jsh.engines.nashorn;
}
var _urls = [];
var defaultEngine = (function() {
	if (shell.rhino) return "rhino";
	if ($api.jsh.engines.nashorn) return "nashorn";
	//	Download Rhino
	$api.console("No default engine; downloading Rhino ...");
	var _file = $api.rhino.download();
	shell.rhino = [_file.toURI().toURL()];
	$api.slime.settings.set("jsh.engine.rhino.classpath", String(_file.getCanonicalPath()));
	return "rhino";
})();
$api.debug("shell = " + shell);
if (!defaultEngine) {
	Packages.java.lang.System.err.println("No compatible JavaScript engine found.");
	Packages.java.lang.System.exit(1);
}
$api.slime.settings.default("jsh.engine", defaultEngine);
if (shell.rhino) {
	//	TODO	possibly redundant with some code in launcher.js; examine and think through
	$api.slime.settings.set("jsh.engine.rhino.classpath", new $api.jsh.Classpath(shell.rhino).local());
	for (var i=0; i<shell.rhino.length; i++) {
		_urls.push(shell.rhino[i]);
	}
}
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
}
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
command.systemProperty("jsh.launcher.classpath", classpath.local());
$api.debug("command = " + command);
var engine = $api.jsh.engines[$api.slime.settings.get("jsh.engine")];
if (!engine) throw new Error("Specified engine not found: " + $api.slime.settings.get("jsh.engine")
	+ " JSH_ENGINE=" + $api.shell.environment.JSH_ENGINE
	+ " jsh.engine=" + Packages.java.lang.System.getProperty("jsh.engine")
	+ " shell=" + shell
);
command.systemProperty("jsh.launcher.main", engine.main);
$api.debug("command = " + command);
for (var i=0; i<classpath._urls.length; i++) {
	command.classpath(classpath._urls[i]);
}
$api.debug("command = " + command);
command.main(engine.main);
$api.debug("command = " + command);
for (var i=0; i<$api.arguments.length; i++) {
	command.argument($api.arguments[i]);
}
$api.debug("command args = " + command);
//	TODO	try to figure out a way to get rid of HTTP property passthrough; used for testing of HTTP-based launch
//			from Bitbucket
var passthrough = ["http.proxyHost","http.proxyPort"];
$api.debug("passthrough");
for (var i=0; i<passthrough.length; i++) {
	$api.debug("passthrough[" + i + "]");
	if (Packages.java.lang.System.getProperty(passthrough[i])) {
		$api.debug("passthrough[" + i + "] got");
		command.systemProperty(passthrough[i], Packages.java.lang.System.getProperty(passthrough[i]));
		$api.debug("passthrough[" + i + "] gotten");
	} else {
		$api.debug("passthrough[" + i + "] not");
	}
}
$api.debug("command pass = " + command);
var status = command.run({ input: Packages.java.lang.System["in"] });
//	This basically hard-codes the exit at the VM level, meaning this script cannot be embedded.
Packages.java.lang.System.exit(status);