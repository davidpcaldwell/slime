//@ts-check
(
	/**
	 * @param { jsh } jsh
	 */
	function(jsh) {
		var SLIME = jsh.script.file.parent.parent;

		var args = jsh.wf.cli.$f.command.parse({
			options: {},
			arguments: jsh.script.arguments
		});

		jsh.wf.cli.$f.command.process({
			interface: {
				test: function(p) {
					jsh.shell.jsh({
						shell: SLIME,
						script: SLIME.getFile("loader/api/test/fifty/test.jsh.js"),
						arguments: p.arguments,
						evaluate: function(result) {
							jsh.shell.exit(result.status);
						}
					})
				}
			},
			invocation: args
		})
	}
//@ts-ignore
)(jsh);
