//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
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
		java: jsh.file.Pathname,
		rhino: jsh.file.Pathname
	}
});

var JSH_JAVA_HOME = (parameters.options.java) ? parameters.options.java.toString() : null;

var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
var SRC = jsh.script.file.getRelativePath("../../../..").directory;
var SHELL = TMP.getRelativePath("jsh");

var rhino = (parameters.options.rhino) ? "-Djsh.build.rhino.jar=" + parameters.options.rhino : "-Djsh.build.rhino=false";

var jrunscript = (function() {
	if (jsh.shell.jsh.home.getFile("lib/js.jar")) {
		rhino = "-Djsh.build.rhino.jar=" + jsh.shell.jsh.home.getFile("lib/js.jar");
		return {
			command: "java",
			arguments: [
				"-jar", jsh.shell.jsh.home.getFile("lib/js.jar"),
				"-opt", "-1"
			]
		};
	} else {
		return {
			command: "jrunscript",
			arguments: []
		}
	}
})();

jsh.shell.run({
	command: jrunscript.command,
	arguments: [rhino].concat(jrunscript.arguments).concat([
		SRC.getRelativePath("jsh/etc/unbuilt.rhino.js"),
		"build",
		SHELL,
		"-native"
	]),
	environment: jsh.js.Object.set({}, jsh.shell.environment, {
		JSH_BUILD_NOTEST: "true",
		JSH_BUILD_NODOC: "true"
	})
});

jsh.shell.run({
	command: SHELL.directory.getFile("jsh"),
	arguments: [
		SRC.getRelativePath("jsh/test/jsh.shell/properties.jsh.js"),
		"a", "b"
	],
	environment: jsh.js.Object.set({}, jsh.shell.environment, {
		JSH_LAUNCHER_CONSOLE_DEBUG: "true",
		JSH_JAVA_HOME: JSH_JAVA_HOME
	})
});

