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
