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

var f = function() {
	return 8;
};
f.property = "foo";

var file = jsh.script.loader.file("$api-deprecate-properties-file.js", { f: f });

var o = file.o;

var verify = function(b) {
	if (!b) {
		jsh.shell.exit(1);
	}
}

verify(f != o.f);
verify(o.f() == 8);
verify(f.property == "foo");
verify(o.f.property == "foo");

//	TODO	is there some way to actually verify the deprecation?

jsh.shell.echo("o.f.property = " + o.f.property);
