//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var file = jsh.loader.file(jsh.script.getRelativePath("2.js"));

		if (typeof(file.x) != "undefined") jsh.shell.exit(1);
		if (file.y != 3) jsh.shell.exit(1);

		var buffer = new jsh.io.Buffer();
		var singleStream = buffer.writeBinary();

		debugger;
		jsh.shell.jsh(jsh.script.getRelativePath("1.jsh.js"), [], {
			stdout: singleStream,
			stderr: singleStream,
			onExit: function(result) {
				buffer.close();
				jsh.shell.echo("output = " + buffer.readText().asString());
				if (result.status != 0) {
					jsh.shell.echo("Failure in jsh.shell.jsh! (exit status: " + result.status + ")");
					jsh.shell.exit(result.status);
				}
			}
		});
		jsh.shell.echo("Success!");
		jsh.shell.exit(0);
	}
)();
