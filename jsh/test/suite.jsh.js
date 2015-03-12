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

var parameters = jsh.script.getopts({
	options: {
		java: jsh.shell.java.home.pathname,
		jsh: (jsh.shell.jsh.home) ? jsh.shell.jsh.home.pathname : jsh.file.Pathname,
		src: jsh.script.file.getRelativePath("../.."),
		debug: false
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
//	Provide way to set CATALINA_HOME?
//	Provide way to set JSH_LAUNCHER_DEBUG?
//	Provide way to set JSH_SCRIPT_DEBUGGER?
//	Provide way to set JSH_ENGINE?
jsh.shell.echo("Running unit tests ...");
jsh.shell.jsh({
	shell: parameters.options.jsh.directory,
	script: parameters.options.src.directory.getRelativePath("jsh/test/unit.jsh.js")
});

jsh.shell.echo("Running system tests ...");
jsh.shell.jsh({
	shell: parameters.options.jsh.directory,
	script: parameters.options.src.directory.getRelativePath("jsh/test/integration.jsh.js"),
	environment: jsh.js.Object.set({}, jsh.shell.environment, {
		JSH_SCRIPT_DEBUGGER: (parameters.options.debug) ? "rhino" : "none"
	})
});
