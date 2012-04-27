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
