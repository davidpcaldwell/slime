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

var settings = new function() {
	var all = {};
	var NONE = {
		property: false,
		environment: false
	};
	var LOCAL = {
		property: true,
		environment: false
	};
	var INHERIT = {
		property: true,
		environment: true
	};

	var map = function(name,type) {
		all[name] = {
			type: type,
			value: $api.slime.setting(name)
		};
	};

	map("jsh.launcher.debug", LOCAL);
	map("jsh.shell.container", LOCAL);
	map("jsh.debug.jdwp", NONE);
	map("jsh.java.logging.properties", NONE);
	map("jsh.jvm.options", NONE);
	map("jsh.rhino.classpath", INHERIT);
	map("jsh.slime.src", INHERIT);
	map("jsh.engine", INHERIT);
	map("jsh.rhino.optimization", INHERIT);
	map("jsh.script.debugger", LOCAL);

	this.get = function(name) {
		return all[name].value;
	}

	this.set = function(name,value) {
		all[name].value = value;
	}

	this.properties = function() {
		var rv = [];
		for (var x in all) {
			if (all[x].type.property && all[x].value) {
				rv.push("-D" + x + "=" + String(all[x].value));
			}
		}
		return rv;
	};

	this.environment = function(rv) {
		for (var x in all) {
			if (all[x].type.environment && all[x].value) {
				rv[x] = String(all[x].value);
			}
		}
	}
};

$api.debug.on = Boolean(settings.get("jsh.launcher.debug"));

$api.debug("Source: " + $api.slime.src);
$api.debug("$api.script: " + $api.script);

//	TODO	Obviously under Cygwin shell does not include the paths helper
var args = {
	vm: [],
	launcher: []
};

var container = (function() {
	var containers = {
		classloader: function() {
			return new function() {
				this.vmargument = function(s) {
					args.vm.push(s);
				}
			}
		},
		jvm: function() {
			return new function() {
				this.vmargument = function(s) {
					args.launcher.push(s);
				}
			}
		}
	};

	var id = (settings.get("jsh.shell.container")) ? settings.get("jsh.shell.container") : "classloader";
	return containers[id]();
})();

//	TODO	if JSH_SHELL_CONTAINER is jvm, debugger will not be run anywhere
if (settings.get("jsh.debug.jdwp")) {
	container.vmargument("-agentlib:jdwp=" + settings.get("jsh.debug.jdwp"));
}
if (settings.get("jsh.java.logging.properties")) {
	container.vmargument("-Djava.util.logging.config.file=" + settings.get("jsh.java.logging.properties"));
}
if (settings.get("jsh.jvm.options")) {
	settings.get("jsh.jvm.options").split(" ").forEach(function(argument) {
		container.vmargument(argument);
	});
}

//	Allow sending arguments beginning with dash that will be interpreted as VM switches
while($api.arguments.length > 0 && $api.arguments[0].substring(0,1) == "-") {
	args.vm.push($api.arguments.shift());
}

$api.engine.runCommand = (function(was) {
	return function() {
		$api.debug("Running: " + Array.prototype.slice.call(arguments).join(" "));
		return was.apply(this,arguments);
	}
})($api.engine.runCommand);

settings.set("jsh.rhino.classpath", $api.rhino.classpath);
settings.set("jsh.slime.src", $api.slime.src);

//	TODO	under various circumstances, we could execute this without forking a VM; basically, if args.vm.length == 0 we could
//			instead create a classloader using $api.slime.launcher.getClasses() and call main() on inonit.script.jsh.launcher.Main
Packages.java.lang.System.exit($api.engine.runCommand.apply(null, [
	$api.java.launcher
].concat(
	args.vm
).concat(
	settings.properties()
).concat([
	"-classpath", $api.slime.launcher.getClasses(),
	"inonit.script.jsh.launcher.Main"
]).concat(
	args.launcher
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
			settings.environment(this);

			//	Below here is legacy stuff we need to think through and delete
			var passthrough = ["JSH_PLUGINS"];
			passthrough.forEach(function(name) {
				if (env[name]) {
					this[name] = env[name];
				}
			},this);
			if ($api.slime.src) {
				this.JSH_LIBRARY_SCRIPTS_LOADER = $api.slime.src.getPath("loader");
				this.JSH_LIBRARY_SCRIPTS_JSH = $api.slime.src.getPath("jsh/loader");
				this.JSH_LIBRARY_MODULES = $api.slime.src.getPath(".");
			}
		})()
		//	Cannot be enabled at this time; see issue 152
		,input: Packages.java.lang.System["in"]
	}
])));