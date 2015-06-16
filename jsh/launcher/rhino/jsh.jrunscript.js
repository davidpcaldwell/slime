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

$api.debug.on = Boolean(env.JSH_LAUNCHER_DEBUG);
$api.debug("Source: " + slime.src);

//	Build the launcher classes
var LAUNCHER_CLASSES = slime.launcher.compile();

//	TODO	Obviously under Cygwin shell does not include the paths helper
var args = {
	vm: []
};
//	TODO	if JSH_SHELL_CONTAINER is jvm, debugger will not be run anywhere
if (this.AGENTLIB_JDWP && env.JSH_SHELL_CONTAINER != "jvm") {
	args.vm.push("-agentlib:jdwp=" + this.AGENTLIB_JDWP);
}
if (env.JSH_SHELL_CONTAINER != "jvm" && env.JSH_JAVA_LOGGING_PROPERTIES) {
	args.vm.push("-Djava.util.logging.config.file=" + env.JSH_JAVA_LOGGING_PROPERTIES)
}
if (env.JSH_SHELL_CONTAINER != "jvm" && env.JSH_JVM_OPTIONS) {
	args.vm.push.apply(args,env.JSH_JVM_OPTIONS.split(" "));
}

//	Allow sending arguments beginning with dash that will be interpreted as VM switches
while($api.arguments.length > 0 && $api.arguments[0].substring(0,1) == "-") {
	args.vm.push($api.arguments.shift());
}

$api.debug("$api.script: " + $api.script);
$api.debug("Running: " + $api.arguments.join(" "));
Packages.java.lang.System.exit($api.engine.runCommand.apply(null, [
	$api.java.launcher
].concat(
	args.vm
).concat([
	"-classpath", LAUNCHER_CLASSES,
	"inonit.script.jsh.launcher.Main"
]).concat(
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
			this.JSH_SLIME_SRC = slime.src.toString();
			this.JSH_RHINO_SCRIPT = slime.src.getPath("jsh/launcher/rhino/jsh.rhino.js");
			this.JSH_LIBRARY_SCRIPTS_LOADER = slime.src.getPath("loader");
			this.JSH_LIBRARY_SCRIPTS_RHINO = slime.src.getPath("loader/rhino");
			this.JSH_LIBRARY_SCRIPTS_JSH = slime.src.getPath("jsh/loader");
			this.JSH_LIBRARY_MODULES = slime.src.getPath(".");
		})()
		//	Cannot be enabled at this time; see issue 152
		,input: Packages.java.lang.System["in"]
	}
])));