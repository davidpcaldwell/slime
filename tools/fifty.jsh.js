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
				test: $api.Function.pipe(
					jsh.wf.cli.$f.option.boolean({ longname: "debug:rhino" }),
					function(p) {
						jsh.shell.jsh({
							shell: SLIME,
							script: SLIME.getFile("loader/api/test/fifty/test.jsh.js"),
							arguments: p.arguments,
							environment: $api.Object.compose(
								jsh.shell.environment,
								p.options["debug:rhino"] ? {
									JSH_DEBUG_SCRIPT: "rhino"
								} : {}
							),
							evaluate: function(result) {
								jsh.shell.exit(result.status);
							}
						})
					}
				)
			},
			invocation: args
		})
	}
//@ts-ignore
)(jsh);
