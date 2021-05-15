//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	TODO	this would be a useful automted test
var SLIME = jsh.script.file.parent.parent.parent.parent.parent;

var zero = jsh.shell.jsh({
	shell: jsh.shell.jsh.src,
	script: SLIME.getFile("jsh/test/jsh-data.jsh.js"),
	stdio: {
		output: String,
		error: String
	},
	evaluate: function(result) {
		if (result.stdio.error.length) {
			jsh.shell.console("Problem:\n" + result.stdio.error);
		}
		return !result.stdio.error.length;
	}
});

jsh.shell.exit( (zero) ? 0 : 1 );
