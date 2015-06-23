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
	if ($api.script.file.getParentFile().getName().equals("rhino")) {
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
		$api.debug("Running: " + Array.prototype.slice.call(arguments).join(" "));
		return was.apply(this,arguments);
	}
})($api.engine.runCommand);

//	Supply arguments whose default values are provided by the jrunscript API
if (!$api.slime.settings.get("jsh.engine.rhino.classpath")) $api.slime.settings.set("jsh.engine.rhino.classpath", $api.rhino.classpath);
if (!$api.slime.settings.get("jsh.slime.src")) $api.slime.settings.set("jsh.slime.src", $api.slime.src);

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

//	TODO	under various circumstances, we could execute this without forking a VM; basically, if args.vm.length == 0 we could
//			instead create a classloader using $api.slime.launcher.getClasses() and call main() on inonit.script.jsh.launcher.Main
Packages.java.lang.System.exit(
	$api.engine.runCommand.apply(
		null,
		[
			install.launcher
		].concat(
			container.getVmArguments()
		).concat(
			$api.slime.settings.getPropertyArguments()
		).concat([
			"-classpath", $api.slime.launcher.getClasses(),
			"inonit.script.jsh.launcher.Main"
		]).concat(
			container.getLauncherArguments()
		).concat(
			$api.arguments
		).concat([
			{
				env: new (function() {
					for (var x in env) {
						if (/^JSH_/.test(x)) {
						} else {
							this[x] = env[x];
						}
					}
					$api.slime.settings.environment(this);

					//	Below here is legacy stuff we need to think through and delete
					var passthrough = ["JSH_PLUGINS"];
					passthrough.forEach(function(name) {
						if (env[name]) {
							this[name] = env[name];
						}
					},this);
				})()
				//	Cannot be enabled at this time; see issue 152
				,input: Packages.java.lang.System["in"]
			}
		])
	)
);