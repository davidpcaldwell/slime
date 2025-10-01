//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var SLIME = jsh.script.file.parent.parent.parent.parent.parent;
		var SRC = SLIME;
		var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var SHELL = TMP.getRelativePath("jsh");

		var parameters = jsh.script.getopts({
			options: {
				java: jsh.file.Pathname,
				rhino: jsh.file.Pathname
			}
		});

		var JSH_JAVA_HOME = (parameters.options.java) ? parameters.options.java.toString() : null;

		var rhino = (parameters.options.rhino) ? ["-rhino", parameters.options.rhino] : [];

		jsh.shell.jsh({
			shell: SLIME,
			script: SLIME.getFile("jsh/etc/build.jsh.js"),
			arguments: [SHELL].concat(rhino).concat(["-executable","-notest","-nodoc"])
		});

		jsh.shell.run({
			command: SHELL.directory.getFile("jsh"),
			arguments: [
				SRC.getRelativePath("jsh/test/jsh-data.jsh.js"),
				"a", "b"
			],
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				JSH_LAUNCHER_COMMAND_DEBUG: "1",
				JSH_JAVA_HOME: JSH_JAVA_HOME
			})
		});
	}
)();
