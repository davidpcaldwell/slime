//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var tmp = jsh.shell.TMPDIR.createTemporary({ prefix: "issue62.", suffix: ".txt" });
		var _writer = new Packages.java.io.PrintWriter(new Packages.java.io.FileWriter(tmp.pathname.java.adapt()));
		_writer.println("First line");
		_writer.println("Second line");
		_writer.close();

		var rv = [];
		tmp.readLines(function(line) {
			rv.push(line);
		});
		jsh.shell.echo(rv.join("|"));
	}
)();
