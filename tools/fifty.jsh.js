//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var SLIME = jsh.script.file.parent.parent;

		var args = jsh.wf.cli.$f.command.parse({
			options: {},
			arguments: jsh.script.arguments
		});

		jsh.wf.cli.$f.command.process({
			interface: {
				view: $api.Function.pipe(
					jsh.script.cli.option.boolean({ longname: "debug:rhino" }),
					function(p) {
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.script.file.parent.getFile("fifty/documentation.jsh.js"),
							arguments: p.arguments,
							environment: $api.Object.compose(
								jsh.shell.environment,
								(p.options["debug:rhino"]) ? {
									JSH_DEBUG_SCRIPT: "rhino"
								} : {}
							)
						});
					}
				),
				test: {
					jsh: $api.Function.pipe(
						jsh.wf.cli.$f.option.boolean({ longname: "debug:rhino" }),
						jsh.script.cli.option.array({
							longname: "property",
							value: function(string) {
								var tokens = string.split("=");
								//	TODO	allow setting property to "true" with length 1, maybe test for presence of property
								if (tokens.length != 2) throw new TypeError();
								return {
									name: tokens[0],
									value: tokens[1]
								}
							}
						}),
						function(p) {
							var properties = p.options["property"].reduce(function(rv,element) {
								rv[element.name] = element.value;
								return rv;
							},{});
							return jsh.shell.jsh({
								shell: SLIME,
								script: SLIME.getFile("loader/api/test/fifty/test.jsh.js"),
								arguments: p.arguments,
								environment: $api.Object.compose(
									jsh.shell.environment,
									p.options["debug:rhino"] ? {
										JSH_DEBUG_SCRIPT: "rhino"
									} : {}
								),
								properties: properties,
								evaluate: jsh.shell.run.evaluate.wrap
							});
						},
						function(p) {
							jsh.shell.exit(p.status);
						}
					),
					browser: $api.Function.pipe(
						function(p) {
							return jsh.shell.jsh({
								shell: SLIME,
								script: SLIME.getFile("loader/api/test/fifty/test-browser.jsh.js"),
								arguments: p.arguments,
								environment: $api.Object.compose(
									jsh.shell.environment
								)
							})
						},
						function(p) {
							jsh.shell.exit(p.status);
						}
					)
				}
			},
			invocation: args
		})
	}
//@ts-ignore
)($api,jsh);
