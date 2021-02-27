//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		jsh.shell.console("Adding Gradle wrapper to " + jsh.shell.PWD + " ...");

		//	First, check for the Gradle installation necessary for bootstrapping
		var GRADLE_LOCATION = jsh.shell.jsh.lib.getRelativePath("gradle");
		if (!GRADLE_LOCATION.directory) {
			jsh.tools.gradle.install();
		}

		jsh.shell.run({
			command: GRADLE_LOCATION.directory.getFile("bin/gradle"),
			arguments: [
				"wrapper"
			],
			directory: jsh.shell.PWD
		});
	}
//@ts-ignore
)(jsh);
