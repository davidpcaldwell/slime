//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

jsh.loader.plugins(jsh.script.file.getRelativePath("../../../loader/api"));
jsh.loader.plugins(jsh.script.file.getRelativePath("../../../jsh/unit"));

var parameters = jsh.script.getopts({
	options: {
		mode: "stdio.parent"
	}
});

if (parameters.options.mode == "stdio.parent") {
	var top = new jsh.unit.Scenario({
		composite: true,
		name: "Top",
		view: new jsh.unit.view.Console({ writer: jsh.shell.stdio.output })
	});
	top.add({ scenario: new jsh.unit.Scenario.Html({
		pathname: jsh.script.file.getRelativePath("../../../loader/api/unit.js")
	}) });
	top.add({ scenario: new jsh.unit.Scenario.Fork({
		name: "subprocess",
		run: jsh.shell.jsh,
		fork: true,
		script: jsh.script.file,
		arguments: ["-mode","stdio.child"]
	})});
	var success = top.run();
	jsh.shell.echo("subprocess success? " + success);
	jsh.shell.exit( (success) ? 0 : 1 );
} else if (parameters.options.mode == "stdio.child") {
	jsh.shell.echo("running child");
	var scenario = new jsh.unit.Scenario.Html({
		pathname: jsh.script.file.getRelativePath("../../../loader/api/unit.js")
	});
	new jsh.unit.JSON.Encoder({
		send: function(s) {
			jsh.shell.echo(s);
		}
	}).listen(scenario);
	scenario.run({});
}