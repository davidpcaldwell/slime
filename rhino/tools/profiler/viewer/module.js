//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		//	First, copy the HTML
		var output = (typeof(to) != "undefined") ? to : jsh.shell.TMPDIR.createTemporary({ suffix: ".html" }).pathname;
		var html = $loader.get("viewer.html").read(String);
		var scriptElement = function(s) {
			return '<script type="text/javascript">' + s + "</script>";
		}
		//	TODO	this is pretty brittle; perhaps there is a better solution, especially as we mature jsh.document
		html = html.replace('<link rel="stylesheet" type="text/css" href="viewer.css" />', '<style type="text/css">' + $loader.get("viewer.css").read(String) + "</style>");
		var json = (false) ? jsh.js.toLiteral(profiles) : JSON.stringify(profiles);
		html = html.replace('<script type="text/javascript" src="profiles.js"></script>', scriptElement("var profiles = " + json));
		html = html.replace('<script type="text/javascript" src="viewer.js"></script>', scriptElement($loader.get("viewer.js").read(String)));

		output.write(html, { append: false, recursive: true });
		jsh.shell.echo("Wrote profiling data to " + output, { stream: jsh.shell.stderr });
	}
)();
