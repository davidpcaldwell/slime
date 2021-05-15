//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		html: jsh.file.Pathname
	}
});

if (!parameters.options.html) {
	jsh.shell.console("Usage: " + jsh.script.file.pathname.basename + " -html <file>");
	jsh.shell.exit(1);
}

//var parser = jsh.script.loader.module("parser.js", {
//	api: {
//		java: jsh.java
//	}
//});

//var xhtml = parser.xhtml({ string: jsh.script.file.parent.getFile("test/parser.html").read(String) });
var document = new jsh.document.Document.Html({ string: jsh.script.file.parent.getFile("parser.html").read(String) });
jsh.shell.echo(document);

var again = new jsh.document.Document.Html({ string: jsh.script.file.parent.getFile("parser.html").read(String) });
jsh.shell.console("Again: " + again);
Packages.javafx.application.Platform.exit();
