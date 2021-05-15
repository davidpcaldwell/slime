//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				prompt: String,
				child: false
			}
		});

		if (!parameters.options.child) {
			var SUDO_ASKPASS_INVOCATION = [
				jsh.shell.java.jrunscript,
				jsh.shell.jsh.home.getRelativePath("jsh.js"),
				jsh.script.file.pathname,
				"-prompt","\"" + parameters.options.prompt + "\"",
				"-child"
			].join(" ");
			var SUDO_ASKPASS_SCRIPT = [
				"#!/bin/bash",
				SUDO_ASKPASS_INVOCATION
			].join("\n");
			var SUDO_ASKPASS = jsh.shell.TMPDIR.createTemporary({ suffix: ".bash" });
			jsh.shell.run({
				command: "chmod",
				arguments: ["+x",SUDO_ASKPASS]
			});
			SUDO_ASKPASS.pathname.write(SUDO_ASKPASS_SCRIPT, { append: false });
			jsh.shell.stdout.write(SUDO_ASKPASS.pathname.toString());
		} else {
			var api = jsh.script.loader.file("askpass.js", {
				api: {
					java: jsh.java
				}
			});
			var typed = api.gui({
				prompt: parameters.options.prompt
			});
			jsh.shell.stdout.write(typed + "\n");
			jsh.shell.exit(0);
		}
	}
)();
