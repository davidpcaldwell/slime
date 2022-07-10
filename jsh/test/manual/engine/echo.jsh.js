//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	Compatible with jsh 0.0.4.8
//
//	Expected results:
//		under JDK 8, arguments -builder nashorn ==> should complete successfully
//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		if (true) {
			jsh.shell.console("Script is outdated and needs to be updated and retested.");
			jsh.shell.exit(1);
		}
		var parameters = jsh.script.getopts({
			options: {
				builder: String,
				engine: String
			}
		});

		var javaCommands = jsh.file.Searchpath([jsh.shell.java.home.getRelativePath("bin")]);

		var SRC = jsh.script.file.parent.getRelativePath("../../../..").directory;

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
			arguments: ["-jar", TMP.getRelativePath("jsh.jar"), SRC.getRelativePath("jsh/test/jsh-data.jsh.js")],
			environment: {
				JSH_ENGINE: parameters.options.engine
			}
		});
	}
//@ts-ignore
)(jsh);
