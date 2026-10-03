//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/** @param { slime.jsh.Global } jsh */
	function(jsh) {
		if (jsh.script.arguments[0] != "relaunched") {
			jsh.shell.jsh.relaunch(function(intention) {
				intention.arguments = ["relaunched"];
				return intention;
			});
		}
		var parent = jsh.internal.bootstrap.jsh.invocation.fromSystemProperties();
		var result = jsh.shell.jsh({
			script: jsh.script.file.parent.getRelativePath("../../launcher/test/manual/invocation.jsh.js").file,
			fork: true,
			stdio: { output: "string" },
			evaluate: function(result) { return result; }
		});
		if (result.status != 0) {
			jsh.shell.console("Fork after relaunch failed with status " + result.status);
			jsh.shell.exit(result.status);
		}
		jsh.shell.echo(JSON.stringify({ parent: parent, child: JSON.parse(result.stdio.output) }));
	}
//@ts-ignore
)(jsh);
