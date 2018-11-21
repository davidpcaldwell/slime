//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

// TODO: Is this integrated with the test suite? Does it presently pass?

var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

var suite = {
	initialize: function(scope) {
		scope.topname = "topvalue";
	},
	parts: {}
}

suite.parts.a = new function() {
	this.initialize = function(scope) {
		scope.name = "value";
	};

	this.execute = function(scope,verify) {
		verify(scope.name).is("value");
	};
};

var child = {
	parts: {
		grandchild: new function() {
			this.initialize = function(scope) {
				scope.newname = "newvalue";
			};

			this.execute = function(scope,verify) {
				verify(scope.newname).is("newvalue");
				verify(scope.topname).is("topvalue");
			};
		}
	}
};

suite.parts.child = child;

var object = new jsh.unit.Suite(suite);

var seq = 0;
var apiHtml = jsh.loader.module(jsh.script.file.parent.parent.getRelativePath("api.html.js"), {
	test: true,
	api: {
		assign: Object.assign
	},
	Verify: jsh.unit.Verify,
	run: function(code,scope) {
		if (typeof(code) == "string") {
			//	TODO	move this processing inside the jsh loader (or rhino loader?) so that it can be invoked with name/string
			//			properties. This code, after being moved to jsh loader, can then invoke rhino loader with name/_in
			//			created below then we would invoke jsh loader here with code = { name: ..., string: code }
			//	TODO	it seems likely a more useful name could be used here, perhaps using name of file plus jsapi:id path
			code = {
				name: "<eval>:" + String(++seq),
				type: "application/javascript",
				string: code
			}
		}
		jsh.loader.run(code,scope);
	}
});

var html = jsh.loader.file(jsh.script.file.parent.parent.parent.parent.getRelativePath("jsh/unit/html.js"), {
	html: apiHtml,
	$slime: jsh.unit.$slime,
	test: true
});

object.part("api.html", {
	execute: function(scope,verify) {
		var parsed = html.test.loadApiHtml(jsh.script.file.parent.getFile("issue/api.html"));
		var tests = new apiHtml.ApiHtmlTests(parsed, "issue/api.html");
		var object = tests.getElement("object");
		var field = tests.getElement("object/field");
		verify(object).is.type("object");
		verify(child).is.type("object");
		var foo = tests.getElement("foo");
		verify(foo).is(null);
		var field = tests.getElement("field");
		verify(field).is.type("object");
	}
});

var scan = function(suite) {
	var parts = suite.getParts();
	var rv = {};
	for (var x in parts) {
		if (parts[x].getParts) {
			rv[x] = scan(parts[x]);
		} else {
			rv[x] = {};
		}
	}
	return rv;
}

jsh.shell.echo("Scan: " + JSON.stringify(scan(object), void(0), "    "), { stream: jsh.shell.stdio.error });

jsh.unit.interface.create(object, { view: parameters.options.view });
