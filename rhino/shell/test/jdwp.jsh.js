//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		child: false,
		view: "console",
		explicit: false
	}
});

if (jsh.shell.jsh.home && !jsh.shell.jsh.src) {
	jsh.shell.jsh.src = jsh.shell.jsh.home.getSubdirectory("src");
}

var suite = new jsh.unit.Suite();

if (parameters.options.child) {
	suite.part("check", {
		execute: function(scope,verify) {
			if (!parameters.options.explicit) {
				verify(jsh.shell.environment,"environment").evaluate.property("JSH_DEBUG_JDWP").is(void(0));
			} else {
				verify(jsh.shell.environment,"environment").evaluate.property("JSH_DEBUG_JDWP").is("false");
			}
		}
	})
} else {
	if (jsh.shell.environment.JSH_DEBUG_JDWP != "false") {
		var result = jsh.shell.jsh({
			fork: true,
			script: jsh.script.file,
			arguments: ["-view", parameters.options.view].concat( (parameters.options.child) ? ["-child"] : [] ),
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				JSH_DEBUG_JDWP: "false"
			})
		});
		jsh.shell.exit(result.status);
	}

	suite.part("parent", {
		execute: function(scope,verify) {
			//	This test is valid only if the JSH_DEBUG_JDWP variable is set to false; the test is whether the implementation
			//	correctly omits the variable from the child script
			verify(jsh.shell.environment,"environment").evaluate.property("JSH_DEBUG_JDWP").is("false");
		}
	});
	suite.part("fork", jsh.unit.Suite.Fork({
		name: "fork",
		run: jsh.shell.jsh,
		fork: true,
		script: jsh.script.file,
		arguments: ["-child","-view","stdio"]
	}));
	suite.part("unbuilt", jsh.unit.Suite.Fork({
		name: "unbuilt",
		run: jsh.shell.jsh,
		shell: jsh.shell.jsh.src,
		script: jsh.script.file,
		arguments: ["-child","-view","stdio"]
	}));
	suite.part("unbuilt explicit", jsh.unit.Suite.Fork({
		name: "unbuilt explicit",
		run: jsh.shell.jsh,
		shell: jsh.shell.jsh.src,
		script: jsh.script.file,
		arguments: ["-child","-view","stdio","-explicit"],
		environment: jsh.shell.environment
	}));
}

jsh.unit.interface.create(suite, { view: parameters.options.view });
