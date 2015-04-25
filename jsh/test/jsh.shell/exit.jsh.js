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

var parameters = jsh.script.getopts({
	options: {
		subshell: false,
		engine: String
	}
});

if (parameters.options.subshell) {
	try {
		jsh.shell.exit(3);
	} catch (e) {
		jsh.shell.exit(2);
	}
} else {
	jsh.shell.jsh({
		fork: true,
		script: jsh.script.file.pathname,
		arguments: ["-subshell"],
		evaluate: function(result) {
			if (result.status != 3) {
				jsh.shell.echo("Exit status should be 3; exit status is " + result.status);
				jsh.shell.exit(1);
			} else {
				jsh.shell.echo("Exit status is 3");
			}
		}
	});
}