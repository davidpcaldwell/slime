var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
})

var suite = new jsh.unit.Suite({
	parts: {
		scenario: new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: jsh.shell.jsh.src,
			script: jsh.script.file.parent.getFile("scenario.jsh.js"),
			arguments: [
				"-view", "stdio"
			]
		})
	}
})

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
