//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	come up with a test suite and documentation for this
var parameters = jsh.script.getopts({
	options: {
		//	Determines which of the two modes of operation will be used for this script (see below)
		child: false,

		//	Without the -child argument, the -script argument is used to specify the location of an executable script which will be
		//	produced and will be suitable for use as the value of GIT_ASKPASS
		script: jsh.file.Pathname,

		//	With the -child argument, the -prompt argument is expected, which provides a prompt that will be shown to the user
		prompt: String
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!parameters.options.child) {
	var INVOKE_JSH = (function() {
		if (jsh.shell.jsh.home) {
			return [
				jsh.shell.java.jrunscript,
				jsh.shell.jsh.home.getRelativePath("jsh.js")
			];
		}
		return [
			jsh.shell.java.jrunscript,
			jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
			"jsh"
		];
	})();
	var script = jsh.script.file.parent.getFile("askpass.bash").read(String);
	script = script.replace(/\#INVOKE_JSH\=/, "INVOKE_JSH=\"" + INVOKE_JSH.join(" ") + "\"");
	script = script.replace(/\#ASKPASS_JSH_PATH\=/, "ASKPASS_JSH_PATH=\"" + jsh.script.file + "\"");
	var lines = script.split("\n");
	var SCRIPT = lines.join("\n");
	//	TODO	do not hard-code bash path
	lines.shift("#!/bin/bash");
	parameters.options.script.write(SCRIPT, { append: false });
	jsh.shell.run({
		command: "chmod",
		arguments: ["+x",parameters.options.script]
	});
} else {
	var api = jsh.loader.file(jsh.script.file.parent.parent.parent.getRelativePath("ui/askpass.js"), {
		api: {
			java: jsh.java
		}
	});
	var nomask = /^Username/.test(parameters.options.prompt);
	var typed = api.gui({
		nomask: nomask,
		prompt: parameters.options.prompt
	});
	jsh.shell.stdout.write(typed + "\n");
	jsh.shell.exit(0);
}