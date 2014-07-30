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

//	Compatible with jsh 0.0.4.8
//
//	Expected results:
//		under JDK 8, arguments -builder nashorn ==> should complete successfully
var parameters = jsh.script.getopts({
	options: {
		builder: String,
		engine: String
	}
});

var javaCommands = jsh.file.Searchpath([jsh.shell.java.home.getRelativePath("bin")]);

var SRC = jsh.script.file.getRelativePath("../../../..").directory;

var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });

var unbuiltCommand = SRC.getFile("jsh/etc/unbuilt.rhino.js");

var jjs = javaCommands.getCommand("jjs");

var builders = {};
if (jjs) {
	builders.nashorn = function() {
		jsh.shell.run({
			command: jjs,
			arguments: [unbuiltCommand.toString(), "--", "build", TMP.toString()],
			environment: {
				JSH_BUILD_NOTEST: "true",
				JSH_BUILD_NODOC: "true"
			}
		});
	};
}

builders[parameters.options.builder]();

jsh.shell.run({
	command: jsh.shell.java.launcher,
	arguments: ["-jar", TMP.getRelativePath("jsh.jar"), SRC.getRelativePath("jsh/test/jsh.shell/properties.jsh.js")],
	environment: {
		JSH_ENGINE: parameters.options.engine
	}
});