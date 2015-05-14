//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var api = eval(jsh.script.file.getRelativePath("../etc/api.js").file.read(String));
var all = api.environment("browser").filter(function(declaration) {
	return declaration.api || declaration.test;
});
var SRC = jsh.script.file.parent.parent.parent;
var pathnames = all.map(function(declaration) {
	return SRC.getRelativePath(declaration.path);
});
jsh.shell.echo(pathnames);
jsh.shell.jsh({
	fork: true,
	script: SRC.getFile("jsh/unit/browser.jsh.js"),
	arguments: jsh.script.arguments.concat(pathnames.map(function(pathname) { return pathname.toString() })),
	evaluate: function(result) {
		jsh.shell.exit(result.status);
	}
});
