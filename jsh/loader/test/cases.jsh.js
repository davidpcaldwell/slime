jsh.script.Application.run({
	options: {
		engine: String,
		logging: jsh.file.Pathname
	},
	commands: {
		notFound: {
			getopts: {},
			run: function(parameters) {
				jsh.shell.run({
					command: "jrunscript",
					arguments: [
						jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
						"jsh",
						jsh.script.file.parent.getRelativePath("foo.jsh.js")
					],
					environment: Object.assign({}, jsh.shell.environment, {
						JSH_ENGINE: parameters.global.engine,
						JSH_LOG_JAVA_PROPERTIES: parameters.global.logging
					}),
					evaluate: function(result) {
						jsh.shell.console("Exit status: " + result.status);
						jsh.shell.exit(result.status);
					}
				});
			}
		}
	}
})