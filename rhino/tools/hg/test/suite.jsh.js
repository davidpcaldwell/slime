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
		view: "console",
		part: String
	}
});

var page = new jsh.unit.part.Html({
	name: "module",
	pathname: jsh.script.file.parent.parent.getRelativePath("api.html"),
	environment: {}
	//	TODO	reload converts suite to scenario, which has no parts, so this breaks the search-into-part behavior
	//,reload: true
});

var path;

if (parameters.options.part) {
	var ids = parameters.options.part.split("/");
	path = page.getPath(ids);
	path.unshift("module");
}

var suite = new jsh.unit.Suite({
	parts: {
		module: page
	}
});

jsh.unit.interface.create(suite, {
	view: parameters.options.view,
	path: path
});
