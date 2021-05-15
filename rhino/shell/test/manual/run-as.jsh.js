//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		user: "root",
		scenario: String
	}
});

jsh.shell.run({
	command: "sudo",
	arguments: ["-k"]
});

var out = jsh.shell.run({
	command: "whoami",
	as: "root",
	stdio: {
		output: String
	},
	evaluate: function(result) {
		return result.stdio.output.substring(0,result.stdio.output.length-1);
	}
});
jsh.shell.echo("out = [" + out + "]");
