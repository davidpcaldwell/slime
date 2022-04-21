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
	 * @param { slime.jrunscript.tools.docker.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.docker.Export> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.jrunscript.tools.docker.cli.Interface } */
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
			},
			/**
			 *
			 * @param { slime.jrunscript.tools.docker.cli.AnyCommand } argument
			 * @returns
			 */
			command: function(argument) {
				/**
				 *
				 * @param { slime.jrunscript.tools.docker.cli.JsonCommand } p
				 * @returns { slime.jrunscript.tools.docker.cli.Command }
				 */
				var fromJsonCommand = function(p) {
					return {
						invocation: p.invocation,
						output: {
							json: true,
							truncated: p.output.json.truncated
						},
						result: function(output) {
							return (p.map) ? output.map(p.map) : output;
						}
					}
				};

				/**
				 *
				 * @param { slime.jrunscript.tools.docker.cli.StringCommand } p
				 * @returns { slime.jrunscript.tools.docker.cli.Command }
				 */
				var fromStringCommand = function(p) {
					return {
						invocation: p.invocation,
						output: {
							json: false,
							truncated: false
						},
						result: function(output) {
							return (p.result) ? p.result(output) : (function(output) {
								//	Strip newline
								return output.substring(0, output.length-1);
							})(output);
						}
					}
				};

				/**
				 *
				 * @param { slime.jrunscript.tools.docker.cli.AnyCommand } argument
				 * @returns { argument is slime.jrunscript.tools.docker.cli.JsonCommand }
				 */
				var isJsonCommand = function(argument) {
					return argument["output"] && typeof(argument["output"].json) == "object";
				}

				/**
				 *
				 * @param { slime.jrunscript.tools.docker.cli.AnyCommand } argument
				 * @returns { argument is slime.jrunscript.tools.docker.cli.StringCommand }
				 */
				var isStringCommand = function(argument) {
					return typeof(argument["output"]) == "undefined";
				}

				/**
				 *
				 * @param { slime.jrunscript.tools.docker.cli.AnyCommand } argument
				 * @returns { argument is slime.jrunscript.tools.docker.cli.Command }
				 */
				var isRawCommand = function(argument) {
					return true;
				}

				var command = (
					function(argument) {
						if (isJsonCommand(argument)) return fromJsonCommand(argument);
						if (isStringCommand(argument)) return fromStringCommand(argument);
						if (isRawCommand(argument)) return argument;
						throw new Error("Unreachable");
					}
				)(argument);

				var rv = function(input) {
					var invocation = command.invocation(input);
					var tell = $context.library.shell.world.run(
						$context.library.shell.Invocation.create({
							command: "docker",
							arguments: invocation.command.concat(invocation.arguments).concat(
								(command.output.truncated) ? ["--no-trunc"] : []
							).concat(
								(command.output.json) ? ["--format", "{{json .}}"] : []
							),
							stdio: {
								output: "string",
								error: "line"
							}
						})
					);
					return {
						run: $api.Function.impure.ask(function(events) {
							var rv;
							tell({
								stderr: function(e) {
									events.fire("stderr", e.detail.line);
								},
								exit: function(e) {
									var status = e.detail.status;
									if (status != 0) throw new Error("Exit status: " + status);
									if (command.output.json) {
										var array = e.detail.stdio.output.split("\n").filter(function(string) { return Boolean(string); }).map(function(string) { return JSON.parse(string); });
										rv = command.result(array);
									} else {
										rv = command.result(e.detail.stdio.output);
									}
								}
							})
							return rv;
						})
					}
				};
				return {
					input: rv
				};
			}
		};

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

		/** @type { slime.jrunscript.tools.docker.cli.StringCommand<{
			cidfile?: string
			mounts?: string[]
			image: string
			command: string
			arguments?: string[]
		}> } */
		var containerRun = (
			function() {
				return {
					invocation: function(p) {
						return {
							command: ["container", "run"],
							arguments: $api.Array.build(function(rv) {
								if (p.cidfile) rv.push("--cidfile", p.cidfile);
								if (p.mounts) p.mounts.forEach(function(mount) {
									rv.push("--mount", mount)
								});
								rv.push(p.image);
								rv.push(p.command);
								if (p.arguments) rv.push.apply(rv, p.arguments);
							})
						}
					}
				}
			}
		)();

		/**
		 * @type { slime.jrunscript.tools.docker.cli.StringCommand<{ source: string, container: string, target: string }> }
		 */
		var cp = {
			invocation: function(p) {
				return {
					command: ["cp"],
					arguments: [
						p.source, p.container + ":" + p.target
					]
				}
			}
		}



		/**
		 *
		 * @param { string } volume
		 * @returns { string }
		 */
		function createVolumeHostContainer(volume) {
			var tmpcid = $context.library.shell.TMPDIR.createTemporary({ prefix: "slime-docker-", suffix: ".cid" }).pathname;
			tmpcid.file.remove();

			cli.command(containerRun).input({
				cidfile: tmpcid.toString(),
				mounts: [
					"source=" + volume +",target=/volume"
				],
				image: "busybox",
				command: "true"
			}).run();

			return tmpcid.file.read(String);
		}

		function copyToVolume(from, volume, path) {
			var container = createVolumeHostContainer(volume);

			cli.command(cp).input({
				source: from,
				container: container,
				target: "/volume/" + path
			}).run();
		}

		function executeWithVolume(volume,command,args) {
			return cli.command(containerRun).input({
				mounts: [
					"source=" + volume +",target=/volume"
				],
				image: "busybox",
				command: command,
				arguments: args
			}).run();
		}

		$export({
			engine: {
				cli: cli,

				volume: {
					copyFileTo: function(p) {
						copyToVolume(p.from, p.volume, p.path);
					},
					executeCommandWith: function(p) {
						return executeWithVolume(p.volume, p.command, p.arguments);
					}
				},

				isRunning: function() {
					/** @type { slime.jrunscript.tools.docker.cli.Command<void,boolean> } */
					var isRunning = {
						invocation: function() {
							return {
								command: ["info"],
								arguments: []
							}
						},
						output: {
							json: true,
							truncated: false
						},
						result: function(json) {
							return !json[0].ServerErrors || json[0].ServerErrors.length == 0;
						}
					};
					return cli.command(isRunning).input().run({
						stderr: function(e) {
							//	do nothing
						}
					});
				}
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
)($api,$context,$export);
