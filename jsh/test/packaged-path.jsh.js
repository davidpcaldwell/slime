//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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
var module = jsh.script.loader.module("path");
if (module.bar != "baz") {
	throw new Error("Failed to load module.");
}
jsh.shell.echo("Success: " + jsh.script.file.pathname.basename);
