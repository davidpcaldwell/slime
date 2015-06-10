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
		status: Number,
		error: false,
		success: false
	}
});

if (typeof(parameters.options.status) == "undefined" && !parameters.options.error && !parameters.options.success) {
	//	test suite
	var failure = false;
	["rhino","nashorn"].forEach(function(engine) {
		["classloader","jvm"].forEach(function(launcher) {
			var fork = function(args,expected) {
				var start = new Date();
				jsh.shell.jsh({
					fork: true,
					script: jsh.script.file,
					arguments: args,
					environment: jsh.js.Object.set({}, jsh.shell.environment,
						{
							JSH_ENGINE: engine,
							JSH_SHELL_CONTAINER: launcher
						}
					),
					evaluate: function(result) {
						var end = new Date();
						jsh.shell.echo(engine + "/" + launcher + ": " + ((end.getTime() - start.getTime())/1000).toFixed(3) + " seconds.");
						if (result.status == expected) {
							jsh.shell.echo("Success exit status = " + expected + ": " + engine + "/" + launcher);
						} else {
							failure = true;
							jsh.shell.echo("Failure: status=" + result.status + ", not " + expected + ", for " + engine + "/" + launcher);
						}
					}
				});
			}

			fork(["-status", "42"], 42);
			fork(["-success"], 0);
			fork(["-error"], 255);
		});
	});
	jsh.shell.echo("Overall: " + ((failure) ? "Failure." : "Success."));
	jsh.shell.exit((failure) ? 1 : 0);
} else if (parameters.options.error) {
	jsh.shell.echo("Throwing error.");
	throw new Error();
} else if (parameters.options.success) {
	jsh.shell.echo("Finishing.");
} else {
	jsh.shell.echo("jsh.shell.rhino = " + jsh.shell.rhino);
	jsh.shell.echo("Packages.inonit.script.jsh.launcher.Main = " + Packages.inonit.script.jsh.launcher.Main);
	jsh.shell.exit(parameters.options.status);
}