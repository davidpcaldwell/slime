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
		"chrome:profile": jsh.file.Pathname
	}
});

var suite = new jsh.unit.Suite(new jsh.unit.Scenario.Html({
	name: "jsh Unit Tests",
	pathname: jsh.script.file.parent.getRelativePath("api.html")
}));
if (parameters.options.view == "model") {
	var Model = function(p) {
		if (p.part.getParts) {
			var parts = p.part.getParts();
			this.parts = {};
			for (var x in parts) {
				this.parts[x] = new Model({ part: parts[x] });
			}
		}

		if (p.part.name) {
			this.name = p.part.name;
		}

		this.structure = function() {
			var rv = {
				name: this.name
			};
			if (this.parts) {
				rv.parts = {};
			}
			for (var x in this.parts) {
				rv.parts[x] = this.parts[x].structure();
			}
			return rv;
		};
	};

	var structure = new Model({ part: suite }).structure();
	jsh.shell.echo(JSON.stringify(structure,void(0),"    "));
} else {
	var view = jsh.unit.view.options.select(parameters.options.view);
	if (parameters.options["chrome:profile"]) {
		var chrome = new jsh.unit.view.Chrome({
			port: parameters.options.port,
			profile: parameters.options["chrome:profile"]
		});
		chrome.listen(suite);
	}
	view.listen(suite);
	suite.run();
}