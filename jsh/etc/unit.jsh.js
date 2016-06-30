//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (!jsh.unit) {
	jsh.loader.plugins(jsh.script.file.getRelativePath("../../loader/api"));
	jsh.loader.plugins(jsh.script.file.getRelativePath("../../jsh/unit"));
}
var parameters = jsh.script.getopts({
	options: {
		view: "console",
		port: Number,
		"chrome:profile": jsh.file.Pathname,
		unit: String
	}
});

var definition = new jsh.unit.part.Html({
	name: "jsh Unit Tests",
	pathname: jsh.script.file.parent.getRelativePath("api.html")
});

var find = function(definition,name,path) {
	if (!path) path = [];
	if (definition.name == name) return path;
	for (var x in definition.parts) {
		var found = find(definition.parts[x],name,path.concat([x]));
		if (found) return found;
	}
	return null;
}

var suite = new jsh.unit.Suite(definition);

jsh.unit.interface.create(suite, new function() {
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	}
	if (parameters.options.unit) {
		this.path = find(definition,parameters.options.unit);
	}
});
