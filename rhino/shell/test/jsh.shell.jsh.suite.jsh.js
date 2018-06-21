//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	Built shells do not contain these plugins
var SLIME = jsh.script.file.parent.parent.parent.parent;
jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));

var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

var suite = new jsh.unit.Suite();

suite.part("local", {
	execute: function(scope,verify) {
		var test = verify.test;
		var module = jsh.shell;

		var unforked = module.jsh({
			script: jsh.script.file.parent.getFile("jsh.jsh.js"),
			arguments: [],
			evaluate: function(result) {
				return result;
			}
		});
		test(unforked.status == 2);
		test(typeof(unforked.command) == "undefined");
		test(typeof(unforked.arguments) == "undefined");
		test(Boolean(unforked.jsh) && Boolean(unforked.jsh.script));

		var forked = module.jsh({
			script: jsh.script.file.parent.getFile("jsh.jsh.js"),
			arguments: [],
			evaluate: function(result) {
				return result;
			},
			fork: true
		});
		verify(forked).status.is(2);
		test(typeof(forked.command) != "undefined" && typeof(forked.command) == "object" && forked.command != null);
		test(forked.command.toString() == jsh.shell.java.jrunscript.toString());
		test(typeof(forked.arguments) != "undefined");
		test(Boolean(forked.jsh) && Boolean(forked.jsh.script));

		var issue82 = module.jsh({
			script: jsh.script.file.parent.getFile("jsh.jsh.js"),
			evaluate: function(result) {
				return (result.status == 2) ? "worked" : "did not work";
			}
		});
		test(issue82 == "worked");
	}
});

suite.part("jdwp", {
	execute: function(scope,verify) {
		verify.scenario(jsh.unit.Suite.Fork({
			name: "jdwp",
			run: jsh.shell.jsh,
			script: jsh.script.file.parent.getFile("jdwp.jsh.js"),
			arguments: ["-view", "stdio"]
		}));
	}
});

if (jsh.httpd.Tomcat) suite.part("http", jsh.unit.Suite.Fork({
	name: "http",
	run: jsh.shell.jsh,
	fork: true,
	script: jsh.script.file.parent.getFile("jsh.jsh.js"),
	arguments: ["-scenario","-view","stdio"]
}));

jsh.unit.interface.create(suite, { view: parameters.options.view });
