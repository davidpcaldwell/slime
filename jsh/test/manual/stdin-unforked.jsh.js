//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		child: false,
		fork: false
	}
});

if (parameters.options.child) {
	var input = jsh.shell.stdio.input.character().asString();
	jsh.shell.console(JSON.stringify({ input: input }));
} else {
	jsh.shell.jsh({
		fork: parameters.options.fork,
		script: jsh.script.file,
		arguments: ["-child"],
		stdio: {
			input: "INPUT"
		}
	});
}
