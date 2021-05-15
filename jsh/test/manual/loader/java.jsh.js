//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var BASE = jsh.script.file.parent.parent.parent.parent.parent;
var HOST = BASE.getRelativePath("jrunscript/host/");
jsh.shell.echo("BASE = " + BASE + " HOST = " + HOST);
