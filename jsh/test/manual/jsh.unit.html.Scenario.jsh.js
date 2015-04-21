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
		mode: String
	}
});
if (!parameters.options.mode) {
	var scenario = new jsh.unit.html.Scenario({
		pathname: jsh.script.file.getRelativePath("../../../loader/api/unit.api.html")
	});
	var success = scenario.run({ console: new jsh.unit.console.Stream({ writer: jsh.shell.stdio.output }) });
	jsh.shell.echo("success? " + success);
	jsh.shell.exit( (success) ? 0 : 1 );
} else if (parameters.options.mode == "stdio.parent") {
	var buffer = new jsh.io.Buffer();
	jsh.java.Thread.start(function() {
		jsh.shell.jsh({
			fork: true,
			script: jsh.script.file,
			arguments: ["-mode","stdio.child"],
			stdio: {
				output: buffer.writeBinary()
			}
		});
		buffer.close();
	});
	var scenario = new jsh.unit.Scenario(new jsh.unit.console.subprocess.Parent({ name: "subprocess", stream: buffer.readBinary() } ).top);
	var success = scenario.run({ console: new jsh.unit.console.Stream({ writer: jsh.shell.stdio.output }) });
	jsh.shell.echo("subprocess success? " + success);
	jsh.shell.exit( (success) ? 0 : 1 );
} else if (parameters.options.mode == "stdio.child") {
	var scenario = new jsh.unit.html.Scenario({
		pathname: jsh.script.file.getRelativePath("../../../loader/api/unit.api.html")
	});
	scenario.run({ console: jsh.unit.console.subprocess.subprocess() });
}