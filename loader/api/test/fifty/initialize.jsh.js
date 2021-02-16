//@ts-check
(
	/**
	 *
	 * @param { jsh } jsh
	 */
	function(jsh) {
		var location = jsh.shell.jsh.src.getRelativePath("local/src/typescript");
		if (!location.directory) {
			var typescript = jsh.tools.git.Repository({ remote: "https://github.com/microsoft/TypeScript.git" });
			typescript.clone({ to: location });
		}
	}
//@ts-ignore
)(jsh)
