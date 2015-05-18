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

var SLIME = jsh.script.file.parent.parent.parent;
jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));
jsh.loader.plugins(jsh.script.file.parent.pathname);

var parameters = jsh.script.getopts({
	options: {
		java: jsh.shell.java.home.pathname,
		jsh: (jsh.shell.jsh.home) ? jsh.shell.jsh.home.pathname : jsh.file.Pathname,
		src: jsh.script.file.getRelativePath("../.."),
		debug: false,
		stdio: false
	}
});

var java = jsh.file.Searchpath([parameters.options.java.directory.getRelativePath("bin")]).getCommand("java");

if (!parameters.options.jsh) {
	parameters.options.jsh = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
	jsh.shell.jrunscript({
		fork: true,
		arguments: [parameters.options.src.directory.getRelativePath("jsh/etc/unbuilt.rhino.js"), "build", parameters.options.jsh],
		environment: jsh.js.Object.set({}, jsh.shell.environment, {
			JSH_BUILD_NOTEST: "true",
			JSH_BUILD_NODOC: "true"
		})
	});
}

var top = new jsh.unit.Scenario({
	composite: true,
	name: "SLIME suite",
	view: (parameters.options.stdio) ? new jsh.unit.view.Events({ writer: jsh.shell.stdio.output }) : new jsh.unit.view.Console({ writer: jsh.shell.stdio.output })
});

//	Provide way to set CATALINA_HOME?
//	Provide way to set JSH_LAUNCHER_DEBUG?
//	Provide way to set JSH_SCRIPT_DEBUGGER?
//	Provide way to set JSH_ENGINE?
jsh.shell.echo("Running unit tests ...");
top.add({ scenario: new jsh.unit.Scenario.Fork({
	name: "Unit tests",
	run: jsh.shell.jsh,
	shell: parameters.options.jsh.directory,
	script: parameters.options.src.directory.getRelativePath("jsh/test/unit.jsh.js"),
	arguments: ["-view","stdio"]
}) });

jsh.shell.echo("Running system tests ...");
top.add({
	scenario: new jsh.unit.Scenario.Fork({
		name: "Integration tests",
		run: jsh.shell.jsh,
		shell: parameters.options.jsh.directory,
		script: parameters.options.src.directory.getRelativePath("jsh/test/integration.jsh.js"),
		arguments: ["-stdio"],
		environment: jsh.js.Object.set({}, jsh.shell.environment, {
			JSH_SCRIPT_DEBUGGER: (parameters.options.debug) ? "rhino" : "none"
		})
	})
});
var success = top.run();
jsh.shell.exit( (success) ? 0 : 1 );