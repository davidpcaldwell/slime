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
	$api.slime = {
		built: $api.script.file.getParentFile()
	};
	$api.script.resolve("slime.js").load();
}

$api.debug.on = Boolean(env.JSH_LAUNCHER_DEBUG);
$api.debug("Source: " + $api.slime.src);

//	Build the launcher classes
var LAUNCHER_CLASSES = $api.slime.launcher.compile();

//	TODO	Obviously under Cygwin shell does not include the paths helper
var args = {
	vm: [],
	launcher: []
};

var container = (function() {
	var containers = {
		jvm: function() {
			return new function() {
				this.vmargument = function(s) {
					args.launcher.push(s);
				}
			}
		},
		classloader: function() {
			return new function() {
				this.vmargument = function(s) {
					args.vm.push(s);
				}
			}
		}
	};

	var id = (env.JSH_SHELL_CONTAINER) ? env.JSH_SHELL_CONTAINER : "classloader";
	return containers[id]();
})();

//	TODO	if JSH_SHELL_CONTAINER is jvm, debugger will not be run anywhere
if (Packages.java.lang.System.getProperty("jsh.debug.jdwp")) {
	container.vmargument("-agentlib:jdwp=" + String(Packages.java.lang.System.getProperty("jsh.debug.jdwp")));
}
if (env.JSH_JAVA_LOGGING_PROPERTIES) {
	container.vmargument("-Djava.util.logging.config.file=" + env.JSH_JAVA_LOGGING_PROPERTIES)
}
if (env.JSH_JVM_OPTIONS) {
	env.JSH_JVM_OPTIONS.split(" ").forEach(function(argument) {
		container.vmargument(argument);
	});
}

//	Allow sending arguments beginning with dash that will be interpreted as VM switches
while($api.arguments.length > 0 && $api.arguments[0].substring(0,1) == "-") {
	args.vm.push($api.arguments.shift());
}

$api.debug("$api.script: " + $api.script);
$api.debug("Running: " + $api.arguments.join(" "));
//	TODO	under various circumstances, we could execute this without forking a VM; basically, if args.vm.length == 0 we could
//			instead create a classloader using LAUNCHER_CLASSES and call main() on inonit.script.jsh.launcher.Main
Packages.java.lang.System.exit($api.engine.runCommand.apply(null, [
	$api.java.launcher
].concat(
	args.vm
).concat([
	"-classpath", LAUNCHER_CLASSES,
	"inonit.script.jsh.launcher.Main"
]).concat(
	args.launcher
).concat(
	$api.arguments
).concat([
	{
		env: new (function() {
			var passthrough = ["JSH_SCRIPT_DEBUGGER","JSH_PLUGINS","JSH_LAUNCHER_DEBUG","JSH_JVM_OPTIONS","JSH_ENGINE","JSH_JAVA_LOGGING_PROPERTIES","JSH_RHINO_OPTIMIZATION","JSH_SHELL_CONTAINER","JSH_HASJAVAC"];
			for (var x in env) {
				if (passthrough.indexOf(x) != -1) {
					this[x] = env[x];
				} else if (/^JSH_/.test(x)) {
				} else {
					this[x] = env[x];
				}
			}
			if (env.JSH_SHELL_CONTAINER != "jvm") delete this.JSH_JVM_OPTIONS;
			if ($api.rhino.classpath) this.JSH_RHINO_CLASSPATH = $api.rhino.classpath;
			if ($api.slime.src) {
				this.JSH_SLIME_SRC = $api.slime.src.toString();
				this.JSH_RHINO_SCRIPT = $api.slime.src.getPath("jsh/launcher/rhino/jsh.rhino.js");
				this.JSH_LIBRARY_SCRIPTS_LOADER = $api.slime.src.getPath("loader");
				this.JSH_LIBRARY_SCRIPTS_RHINO = $api.slime.src.getPath("loader/rhino");
				this.JSH_LIBRARY_SCRIPTS_JSH = $api.slime.src.getPath("jsh/loader");
				this.JSH_LIBRARY_MODULES = $api.slime.src.getPath(".");
			}
		})()
		//	Cannot be enabled at this time; see issue 152
		,input: Packages.java.lang.System["in"]
	}
])));