//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var loader = new jsh.file.Loader(jsh.script.file.parent);
var module = loader.module("child.module.js");
var method = module.$loader.resource;
if (typeof(method) == "undefined") {
	jsh.shell.echo("Resource method is undefined.");
	jsh.shell.exit(1);
} else {
	jsh.shell.echo("Success: resource method is " + method);
}
