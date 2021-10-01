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
	 * @param { slime.loader.Export<slime.jrunscript.tools.docker.Export> } $export
	 */
	function($api,$export) {
		var cli = {
			exec: function(p) {
				return {
					command: ["exec"],
					arguments: $api.Array.build(function(rv) {
						if (p.interactive) rv.push("--interactive");
						if (p.tty) rv.push("--tty");
						rv.push(p.container);
						rv.push(p.command);
						if (p.arguments) rv.push.apply(rv, p.arguments);
					})
				};
			},
			shell: function(p) {
				return {
					command: "docker",
					arguments: p.command.concat(p.arguments)
				};
			}
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.docker.kubectl.Program } program
		 * @returns { slime.jrunscript.tools.docker.kubectl.Installation }
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
			engine: {
				cli: cli
			},
			install: function(p) {
				var versions = {
					macos: {
						"3.6.0": {
							intel: "https://desktop.docker.com/mac/stable/amd64/67351/Docker.dmg"
						},
						latest: {
							intel: "https://desktop.docker.com/mac/stable/amd64/Docker.dmg"
						}
					}
				}
				return $api.Function.impure.tell(function(events) {
					if (!p.destination.directory) {
						if (p.library.shell.os.name == "Mac OS X") {
							//	https://docs.docker.com/desktop/mac/release-notes/
							var distribution = (function() {
								if (p.version) {
									return versions.macos[p.version].intel;
								} else {
									return versions.macos.latest.intel;
								}
							})();
							if (p.version) {
								//	TODO	note that this will get an arbitrary version if it is cached, since the basename is
								//			still Docker.dmg
								var dmg = p.library.install.get({
									url: distribution
								});
								p.library.shell.run({
									command: "hdiutil",
									arguments: ["attach", dmg]
								});
								var invocation = {
									command: "cp",
									arguments: ["-R", "/Volumes/Docker/Docker.app", p.destination]
								};
								if (p.sudo) {
									invocation = p.library.shell.invocation.sudo({
										askpass: p.sudo.askpass
									})(p.library.shell.Invocation.old(invocation))
								}
								p.library.shell.run(invocation);
								events.fire("installed", p.destination.directory);
							}
						} else {
							throw new Error("Unsupported: Docker installation on non-macOS system.");
						}
					} else {
						//	TODO	check for version conflict and decide what to do
						events.fire("found", p.destination.directory);
					}
				})
			},
			kubectl: {
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
			}
		});
	}
//@ts-ignore
)($api,$export);
