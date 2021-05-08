//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var parameters = jsh.script.getopts({
			options: {
				message: "(unspecified)"
			}
		});

		var result = jsh.loader.kotlin.run(jsh.script.file.parent.getFile("kotlin.kts"), {
			bindings: {
				message: parameters.options.message
			}
		});

		jsh.shell.console("");
		jsh.shell.console("result from Kotlin = " + result);
	}
//@ts-ignore
)(jsh);
