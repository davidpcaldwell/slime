//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		status: Number
	}
});

if (typeof(parameters.options.status) == "undefined") {
	//	test suite
	["rhino","nashorn"].forEach(function(engine) {
		["classloader","jvm"].forEach(function(launcher) {
			jsh.shell.jsh({
				fork: true,
				script: jsh.script.file,
				arguments: [
					"-status", "42"
				],
				environment: jsh.js.Object.set({}, jsh.shell.environment,
					{
						JSH_ENGINE: engine,
						JSH_SHELL_CONTAINER: launcher
					}
				),
				evaluate: function(result) {
					if (result.status == 42) {
						jsh.shell.echo("Success exit status = 42: " + engine + "/" + launcher);
					} else {
						jsh.shell.echo("Failure: status=" + result.status + " for " + engine + "/" + launcher);
					}
				}
			});
		});
	});
} else {
	jsh.shell.echo("jsh.shell.rhino = " + jsh.shell.rhino);
	jsh.shell.echo("Packages.inonit.script.jsh.launcher.Main = " + Packages.inonit.script.jsh.launcher.Main);
	jsh.shell.exit(parameters.options.status);
}