//@ts-check
(
	function() {
		var location = jsh.shell.jsh.src.getRelativePath("local/src/typescript");
		if (!location.directory) {
			var typescript = jsh.tools.git.Repository({ remote: "https://github.com/microsoft/TypeScript.git" });
			typescript.clone({ to: location });
		}
	}
)()
