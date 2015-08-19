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
		var events = new $api.Events({
			source: this,
			parent: p.events
		});
		var path = (p.path) ? p.path : [];
		this.path = path;

		if (p.part.getParts) {
			var parts = p.part.getParts();
			this.parts = {};
			for (var x in parts) {
				this.parts[x] = new Model({ part: parts[x], path: this.path.slice().concat([x]), events: events });
			}
		}

		if (p.part.name) {
			this.name = p.part.name;
		}

		var joined = this.path.join("/");

		p.part.listeners.add("test", function(e) {
			if (e.source == p.part) {
				events.fire("model", { path: path, event: e });
			}
		});

		p.part.listeners.add("scenario", function(e) {
			if (e.source == p.part) {
				events.fire("model", { path: path, event: e });
			}
		});

		this.structure = function() {
			var rv = {
				name: this.name,
				path: this.path
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

	var View = function(p) {
		var parts = {};

		if (p.model.parts) {
			for (var x in p.model.parts) {
				parts[x] = new View({ model: p.model.parts[x] });
			}
		}

		this.event = function(e) {
			var type = (p.model.parts) ? "suite" : "scenario"
			jsh.shell.echo("Model: " + type + " (" + p.model.name + ") received " + e.type);
		}

		this.dispatch = function(path,event) {
			if (path.length == 0) {
				this.event(event);
			} else {
				var start = path[0];
				var remaining = path.slice(1);
				parts[start].dispatch(remaining,event);
			}
		}
	}

	var model = new Model({ part: suite });
	var structure = model.structure();
	var view = new View({ model: model });
	model.listeners.add("model", function(e) {
		view.dispatch(e.detail.path,e.detail.event);
	});
	suite.run();
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