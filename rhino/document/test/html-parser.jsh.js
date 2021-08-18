//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {}
		});

		var document = new jsh.document.Document.Html({ string: jsh.script.file.parent.getFile("parser.html").read(String) });
		jsh.shell.echo(JSON.stringify({
			xhtml: document.toString(),
			parser: jsh.document.Document.Html.parser
		}));
		if (jsh.document.Document.Html.parser == "javafx") {
			Packages.javafx.application.Platform.exit();
		}
	}
)();
