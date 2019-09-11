//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

jsh.shell.console("src = " + jsh.shell.jsh.src);

var suite = new jsh.unit.Suite({ name: "fail" });

suite.part("fail", new jsh.unit.html.Part({
	pathname: jsh.script.file.parent.getRelativePath("fail.api.html"),
	reload: true
}));

jsh.unit.interface.create(suite, {
	view: "console"
});
