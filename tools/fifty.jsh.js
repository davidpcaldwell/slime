//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var SLIME = jsh.script.file.parent.parent;

		jsh.script.cli.main(
			jsh.script.cli.program({
				commands: {
					view: $api.fp.pipe(
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
								),
								evaluate: function(result) {
									jsh.shell.exit(result.status);
								}
							});
						}
					),
					test: {
						jsh: $api.fp.pipe(
							jsh.script.cli.option.boolean({ longname: "debug:rhino" }),
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
								var installation = jsh.shell.jsh.Installation.from.current();
								if (jsh.shell.jsh.Installation.is.unbuilt(installation)) {
									/** @type { slime.jsh.shell.Intention } */
									var intention = {
										shell: installation,
										script: SLIME.getRelativePath("tools/fifty/test.jsh.js").toString(),
										arguments: p.arguments,
										environment: function(inherit) {
											return $api.Object.compose(inherit, p.options["debug:rhino"] ? {
												JSH_DEBUG_SCRIPT: "rhino"
											} : {});
										},
										properties: properties,
										stdio: {
											output: "line",
											error: "line"
										}
									};
									var shellIntention = jsh.shell.jsh.Intention.toShellIntention(intention);
									var exit = $api.fp.world.now.question(
										jsh.shell.subprocess.question,
										shellIntention,
										{
											stdout: jsh.shell.Invocation.handler.stdio.line(function(e) {
												jsh.shell.echo(e.detail.line);
											}),
											stderr: jsh.shell.Invocation.handler.stdio.line(function(e) {
												jsh.shell.console(e.detail.line);
											})
										}
									);
									return exit;
								}
							},
							function(p) {
								jsh.shell.exit(p.status);
							}
						),
						browser: $api.fp.pipe(
							function(p) {
								return jsh.shell.jsh({
									shell: SLIME,
									script: SLIME.getFile("tools/fifty/test-browser.jsh.js"),
									arguments: p.arguments,
									environment: $api.Object.compose(
										jsh.shell.environment
									),
									evaluate: function(result) {
										return result;
									}
								})
							},
							function(p) {
								jsh.shell.exit(p.status);
							}
						)
					},
					jsh: $api.fp.pipe(
						jsh.script.cli.option.boolean({ longname: "debug:rhino" }),
						function(p) {
							/** @type { (p: slime.jsh.shell.Installation) => p is slime.jsh.shell.UnbuiltInstallation } */
							var isUnbuilt = function(p) {
								return p["src"];
							};

							var current = jsh.shell.jsh.Installation.from.current();

							/** @type { slime.$api.fp.Identity<slime.jsh.shell.Intention> } */
							var asJshIntention = $api.fp.identity;

							//	TODO	may not need to limit shells at all here
							if (isUnbuilt(current)) {
								$api.fp.now.invoke(
									asJshIntention({
										shell: {
											src: current.src
										},
										script: p.arguments[0],
										arguments: p.arguments.slice(1),
										environment: function(inherit) {
											return $api.Object.compose(
												inherit,
												(p.options["debug:rhino"]) ? { "JSH_DEBUG_SCRIPT": "rhino" } : {}
											)
										}
									}),
									jsh.shell.jsh.Intention.toShellIntention,
									$api.fp.world.output(
										jsh.shell.subprocess.action
									)
								)
							} else {
								jsh.shell.console("Only unbuilt shells can be used to run Fifty scripts.");
								jsh.shell.exit(1);
							}
						}
					)
				}
			})
		)
	}
//@ts-ignore
)($api,jsh);
