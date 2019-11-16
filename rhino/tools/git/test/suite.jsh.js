//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		part: String,
		view: "console"
	}
});

var suite = new jsh.unit.html.Suite();

suite.add("module", new jsh.unit.html.Part({
	name: "module",
	pathname: jsh.script.file.parent.parent.getRelativePath("api.html"),
	environment: {},
	reload: true
}));

jsh.unit.html.cli({
	suite: suite,
	part: parameters.options.part,
	view: parameters.options.view
});
