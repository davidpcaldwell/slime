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

jsh.script.loader = new jsh.script.Loader("../../../loader/test/data/coffee/");
var module = jsh.script.loader.module("module.coffee");
if (module.a != 2) {
	throw new Error("Failed.");
} else {
	jsh.shell.echo("Loaded CoffeeScript module.");
}
if (module.file.b != 3) {
	throw new Error("Failed.");
} else {
	jsh.shell.echo("Loaded CoffeeScript file from CoffeeScript module.");
}
var jmodule = jsh.script.loader.module("loader.js");
if (jmodule.file.b != 3) {
	throw new Error("Failed.");
} else {
	jsh.shell.echo("Loaded CoffeeScript file from JavaScript module.");
}
var file = jsh.script.loader.file("file.coffee");
if (file.b != 3) {
	throw new Error("Failed.");
} else {
	jsh.shell.echo("Loaded CoffeeScript file from JavaScript program.");
}
jsh.shell.echo("Worked.");
