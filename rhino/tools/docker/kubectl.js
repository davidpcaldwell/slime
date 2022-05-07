//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.tools.docker.internal.kubectl.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.kubectl.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jrunscript.tools.kubectl.Program } program
		 * @returns { slime.jrunscript.tools.kubectl.Installation }
		 */
		var kubectl = function(program) {
			return {
				Environment: {
					create: function(environment) {
						/**
						 *
						 * @param { Partial<slime.jrunscript.shell.run.StdioConfiguration> } argument
						 * @returns { slime.jrunscript.shell.run.StdioConfiguration }
						 */
						var stdio = function(argument) {
							return {
								input: (argument && argument.input) ? argument.input : null,
								output: (argument && argument.output) ? argument.output : environment.stdio.output,
								error: (argument && argument.error) ? argument.error : environment.stdio.error
							}
						}

						return {
							Invocation: {
								create: function(p) {
									return {
										configuration: {
											command: program.command,
											arguments: $api.Array.build(function(rv) {
												rv.push(p.command);
												if (p.subcommand) rv.push(p.subcommand);
												if (p.type) rv.push(p.type);
												if (p.name) rv.push(p.name);
												if (p.flags) rv.push.apply(rv, p.flags);
											})
										},
										context: {
											environment: environment.environment,
											stdio: stdio(p.stdio),
											directory: p.directory || environment.directory
										}
									}
								}
							}
						}
					}
				}
			}
		}

		$export({
			Installation: kubectl,
			installation: kubectl({ command: "kubectl" }),
			Invocation: {
				toJson: function(invocation) {
					return $api.Object.compose(invocation, {
						flags: (invocation.flags || []).concat(["-o", "json"]),
						stdio: $api.Object.compose(invocation.stdio || {}, {
							output: "string"
						})
					});
				}
			},
			result: function(world,invocation) {
				return $api.Function.impure.ask(function(events) {
					var tell = world.run(invocation);
					var rv;
					tell({
						stderr: function(e) {
							events.fire("stderr", e.detail);
						},
						exit: function(e) {
							if (e.detail.status != 0) throw new Error("Exit status: " + e.detail.status);
							if (e.detail.stdio && e.detail.stdio.output) rv = JSON.parse(e.detail.stdio.output);
						}
					});
					return rv;
				})
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
