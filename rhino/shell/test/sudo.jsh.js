//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		password: String,
		correct: false
	}
});
jsh.shell.run({
	command: "sudo",
	arguments: ["-k"]
});

var run = function() {
	jsh.shell.os.sudo({
		password: parameters.options.password,
		command: "ls",
		stdio: {
			error: String
		},
		evaluate: function(result) {
			if (result.status) {
				throw new Error("Exit status: " + result.status + " stderr: " + result.stdio.error);
			}
		}
	});
};

if (typeof(parameters.options.password) == "undefined") {
	try {
		run();
		jsh.shell.echo("Command succeeded but should have failed.");
		jsh.shell.exit(1);
	} catch (e) {
		if (e instanceof jsh.shell.os.sudo.PasswordRequired) {
			jsh.shell.echo("Correctly generated PasswordRequired exception.");
		} else {
			jsh.shell.echo("Wrong error: " + e);
			jsh.shell.exit(1);
		}
	}
} else if (parameters.options.correct) {
	try {
		run();
	} catch (e) {
		jsh.shell.echo("Unexpected exception: " + e);
		jsh.shell.exit(1);
	}
} else {
	try {
		run();
		jsh.shell.echo("Command succeeded but should have failed.");
		jsh.shell.exit(1);
	} catch (e) {
		if (e instanceof jsh.shell.os.sudo.PasswordIncorrect) {
			jsh.shell.echo("Correctly generated PasswordIncorrect exception.");
		} else {
			jsh.shell.echo("Wrong error: " + e);
			jsh.shell.exit(1);
		}
	}
}