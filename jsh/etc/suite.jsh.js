//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (jsh.test && jsh.test.requireBuiltShell) {
	jsh.test.requireBuiltShell();
}

var SLIME = jsh.script.file.parent.parent.parent;
jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));
jsh.loader.plugins(jsh.script.file.parent.pathname);

var parameters = jsh.script.getopts({
	options: {
		java: jsh.shell.java.home.pathname,
		jsh: jsh.shell.jsh.home.pathname,
		src: jsh.script.file.getRelativePath("../.."),
		debug: false,
		view: "console",
		"chrome:profile": jsh.file.Pathname,
		port: Number
	}
});

var java = jsh.file.Searchpath([parameters.options.java.directory.getRelativePath("bin")]).getCommand("java");

var suite = new jsh.unit.Suite({
	name: "SLIME suite"
});
suite.scenario("unit", jsh.unit.Suite.Fork({
	name: "Unit tests",
	run: jsh.shell.jsh,
	shell: parameters.options.jsh.directory,
	script: parameters.options.src.directory.getRelativePath("jsh/etc/unit.jsh.js"),
	arguments: ["-view","stdio"]
}));
suite.scenario("integration", jsh.unit.Suite.Fork({
	name: "Integration tests",
	run: jsh.shell.jsh,
	shell: parameters.options.jsh.directory,
	script: parameters.options.src.directory.getRelativePath("jsh/etc/integration.jsh.js"),
	arguments: ["-view","stdio"],
	environment: jsh.js.Object.set({}, jsh.shell.environment, {
		JSH_SCRIPT_DEBUGGER: (parameters.options.debug) ? "rhino" : "none"
	})
}));
jsh.unit.interface.create(suite, new function() {
	if (parameters.options.view == "ui") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	}
});

//	Provide way to set CATALINA_HOME?
//	Provide way to set JSH_LAUNCHER_DEBUG?
//	Provide way to set JSH_SCRIPT_DEBUGGER?
//	Provide way to set JSH_ENGINE?
//if (!parameters.options.suite) {
//	top.add({ scenario: new jsh.unit.Scenario.Fork({
//		name: "Unit tests",
//		run: jsh.shell.jsh,
//		shell: parameters.options.jsh.directory,
//		script: parameters.options.src.directory.getRelativePath("jsh/test/unit.jsh.js"),
//		arguments: ["-view","stdio"]
//	}) });
//} else {
//	top.scenario("unit", jsh.unit.Suite.Fork({
//		name: "Unit tests",
//		run: jsh.shell.jsh,
//		shell: parameters.options.jsh.directory,
//		script: parameters.options.src.directory.getRelativePath("jsh/test/unit.jsh.js"),
//		arguments: ["-view","stdio"]
//	}));
//}
//jsh.shell.echo("Running system tests ...");
//top.add({
//	scenario: new jsh.unit.Scenario.Fork({
//		name: "Integration tests",
//		run: jsh.shell.jsh,
//		shell: parameters.options.jsh.directory,
//		script: parameters.options.src.directory.getRelativePath("jsh/test/integration.jsh.js"),
//		arguments: ["-stdio"],
//		environment: jsh.js.Object.set({}, jsh.shell.environment, {
//			JSH_SCRIPT_DEBUGGER: (parameters.options.debug) ? "rhino" : "none"
//		})
//	})
//});
