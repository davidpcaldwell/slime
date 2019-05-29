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
		omit: false,
		wrong: String,
		prompt: false
	}
});

var run = function(p) {
	if (!p) p = {};
	jsh.shell.os.sudo({
		password: p.password,
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

if (parameters.options.omit) {
	try {
		run();
		jsh.shell.console("Command succeeded but should have failed.");
		jsh.shell.exit(1);
	} catch (e) {
		if (e instanceof jsh.shell.os.sudo.PasswordRequired) {
			jsh.shell.console("Correctly generated PasswordRequired exception.");
		} else {
			jsh.shell.console("Wrong error: " + e);
			jsh.shell.exit(1);
		}
	}
} else if (parameters.options.wrong) {
	try {
		run({ password: parameters.options.wrong });
	} catch (e) {
		if (e instanceof jsh.shell.os.sudo.PasswordIncorrect) {
			jsh.shell.echo("Correctly generated PasswordIncorrect exception.");
		} else {
			jsh.shell.echo("Wrong error: " + e);
			jsh.shell.exit(1);
		}
	}
} else if (parameters.options.prompt) {
	try {
		run({ password: function() {
			return jsh.ui.askpass.gui({ prompt: "Account password:" });
		} });
		jsh.shell.console("Correctly did not generate exception.");
	} catch (e) {
		jsh.shell.echo("Unexpected exception: " + e);
		jsh.shell.exit(1);
	}
} else {
	jsh.shell.jsh({
		fork: true,
		script: jsh.script.file,
		arguments: ["-omit"]
	});
	jsh.shell.jsh({
		fork: true,
		script: jsh.script.file,
		arguments: ["-wrong", "WRONG"]
	});
	jsh.shell.jsh({
		fork: true,
		script: jsh.script.file,
		arguments: ["-prompt"]
	})
}
