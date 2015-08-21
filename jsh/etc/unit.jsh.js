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
	var View = function(p) {
		var parts = {};

		if (p.model.getParts) {
			var mparts = p.model.getParts();
			for (var x in mparts) {
				parts[x] = new View({ model: mparts[x] });
			}
		}

		this.event = function(e) {
			var type = (p.model.getParts) ? "suite" : "scenario";
			if (e.source == p.model) {
				if (e.type == "scenario") {
					if (e.detail.start) {
						jsh.shell.echo(p.model.name + " Start: " + e.detail.start.name)
					} else if (e.detail.end) {
						jsh.shell.echo(p.model.name + " End: " + e.detail.end.name + " " + ((e.detail.success) ? "pass" : "fail"));
					}
				} else if (e.type == "test") {
					jsh.shell.echo(e.detail.message);
				}
//				jsh.shell.echo("Model: " + type + " (" + p.model.name + ") received " + e.type + " with path " + e.path.map(function(node) { return node.id; }));
			}
		}

		this.send = function(path,event) {
			if (path.length == 0) {
				this.event(event);
			} else {
				var start = path[0];
				var remaining = path.slice(1);
				if (start.id) {
					if (!parts[start.id]) jsh.shell.echo("No part with ID " + start.id);
					parts[start.id].send(remaining,event);
				}
			}
		}

		this.dispatch = function(event) {
			this.send(event.path,event);
		}
	}

	jsh.unit.view.options.select("console").listen(suite);
	if (parameters.options["chrome:profile"]) {
		var chrome = new jsh.unit.view.Chrome.Ui({
			port: parameters.options.port,
			profile: parameters.options["chrome:profile"],
			suite: suite
		});
	} else {
		throw new Error("Unimplemented.");
	}
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