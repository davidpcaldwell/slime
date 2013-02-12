//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (jsh.script.script) {
	jsh.script.loader = new jsh.script.Loader(jsh.script.file.getRelativePath("packaged-path").directory);
}
var file = jsh.script.loader.file("file.js");
if (file.bar != "bar") {
	throw new Error("Failed to load file.");
}
var module = jsh.script.loader.module("path/");
if (module.bar != "baz") {
	throw new Error("Failed to load module.");
}
jsh.shell.echo("Success: " + jsh.script.file.pathname.basename);
