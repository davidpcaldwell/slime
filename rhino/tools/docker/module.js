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
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.tools.docker.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		if (!$context.library.file) throw new Error("Required: library.file");
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
					var tell = $context.library.shell.world.action(
						$context.library.shell.Invocation.from.argument({
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
						run: $api.fp.world.old.ask(function(events) {
							var rv;
							$api.fp.world.now.tell(
								tell,
								{
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
								}
							);
							return rv;
						})
					}
				};
				return {
					input: rv
				};
			}
		};

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

			return cli.command(cp).input({
				source: from,
				container: container,
				target: "/volume/" + path
			});
		}

		function executeWithVolume(volume,command,args) {
			return cli.command(containerRun).input({
				mounts: [
					"source=" + volume +",target=/volume"
				],
				image: "busybox",
				command: command,
				arguments: args
			});
		}

		var kubectl = (
			function() {
				/** @type { slime.jrunscript.tools.docker.internal.kubectl.Script } */
				var script = $loader.script("kubectl.js");
				return script();
			}
		)();

		$export({
			engine: {
				isRunning: function() {
					//	Current implementation attempts to use the CLI

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
				},

				volume: {
					copyFileTo: function(p) {
						return copyToVolume(p.from, p.volume, p.path).run;
					},
					executeCommandWith: function(p) {
						return executeWithVolume(p.volume, p.command, p.arguments).run;
					}
				},

				cli: cli,

				api: (
					function() {
						/**
						 * @template { any } P
						 * @template { any } Q
						 * @template { any } B
						 * @template { any } R
						 * @param { { method?: string, url: string } } e
						 * @returns { slime.jrunscript.tools.docker.internal.Endpoint<P,Q,B,R> }
						 */
						var define = function(e) {
							return function(spi, p) {
								if (!p) p = {};
								var url = e.url;
								if (p.path) {
									for (var x in p.path) {
										url = url.replace("{" + x + "}", String(p.path[x]));
									}
								}
								var query = $api.fp.result(
									p.query,
									$api.fp.pipe(
										Object.entries,
										$api.fp.Array.map(function(entry) {
											return { name: entry[0], value: String(entry[1]) }
										}),
										$context.library.web.Url.query,
										function(query) {
											return (query) ? "?" + query : ""
										}
									)
								)
								var ask = $api.fp.world.input(spi({
									request: {
										method: (e.method) ? e.method : "GET",
										url: $context.library.web.Url.codec.string.decode("http://docker.sock.unix" + url + query),
										headers: [],
										body: (p.body) ? $context.library.http.Body.json()(p.body) : void(0)
									},
									timeout: void(0),
									proxy: void(0)
								}));
								var result = ask();
								var json = result.stream.character().asString();
								return (json) ? JSON.parse(json) : void(0);
							}
						}

						/**
						 *
						 * @param { slime.jrunscript.http.client.spi.Implementation } implementation
						 * @returns { slime.jrunscript.tools.docker.api.Interface }
						 */
						var Api = function(implementation) {
							/**
							 *
							 * @template { any } P
							 * @template { any } Q
							 * @template { any } B
							 * @template { any } R
							 * @param { string } method
							 * @param { string } path
							 * @returns { slime.jrunscript.tools.docker.api.Endpoint<P,Q,B,R> }
							 */
							var toMethod = function(method, path) {
								var defined = define({ method: method, url: path });
								/** @type { slime.js.Cast<R> } */
								var toR = $api.fp.cast.unsafe;
								return function(p) {
									/** @type { R } */
									var rv = toR(defined(implementation, p));
									return rv;
								}
							}

							return {
								SystemInfo: toMethod("GET", "/info"),

								ContainerList: toMethod("GET", "/containers/json"),
								ContainerCreate: toMethod("POST", "/containers/create"),
								ContainerDelete: toMethod("DELETE", "/containers/{id}"),

								VolumeList: toMethod("GET", "/volumes"),
								VolumeCreate: toMethod("POST", "/volumes/create"),
								VolumeDelete: toMethod("DELETE", "/volumes/{name}")
							};
						}

						var DOCKER_SOCKET = $context.library.file.Location.from.os("/var/run/docker.sock");
						if ($context.library.shell.PATH.getCommand("curl") && $context.library.file.Location.file.exists.simple(DOCKER_SOCKET)) {
							return Api($context.library.curl({
								unixSocket: "/var/run/docker.sock"
							}))
						}
					}
				)()
			},
			install: function(p) {
				var versions = {
					macos: {
						"3.6.0": {
							intel: "https://desktop.docker.com/mac/stable/amd64/67351/Docker.dmg"
						},
						latest: {
							intel: "https://desktop.docker.com/mac/main/amd64/Docker.dmg",
							apple: "https://desktop.docker.com/mac/main/arm64/Docker.dmg"
						}
					}
				}
				return function(events) {
					if (!p.destination.directory) {
						if (p.library.shell.os.name == "Mac OS X") {
							//	https://docs.docker.com/desktop/mac/release-notes/
							var distribution = (function(arch) {
								if (p.version && arch == "amd64") {
									return versions.macos[p.version].intel;
								} else if (arch == "aarch64") {
									return versions.macos.latest.apple;
								} else {
									return versions.macos.latest.intel;
								}
							})(p.library.shell.os.arch);
							//	TODO	note that this will get an arbitrary version if it is cached, since the basename is
							//			still Docker.dmg
							//	TODO	Also should be careful to quit Docker Desktop
							//	TODO	Also should be careful to hdiutil detach /Volumes/Docker in case multiple versions are
							//			mounted
							var dmg = p.library.install.get({
								url: distribution
							});
							p.library.shell.run({
								command: "hdiutil",
								arguments: ["attach", dmg]
							});
							/** @type { slime.jrunscript.shell.invocation.Argument } */
							var argument = {
								command: "cp",
								arguments: ["-R", "/Volumes/Docker/Docker.app", p.destination.toString()]
							};
							var invocation = p.library.shell.Invocation.from.argument(argument);
							if (p.sudo) {
								invocation = p.library.shell.Invocation.sudo({
									askpass: p.sudo.askpass
								})(invocation)
							}
							$api.fp.world.now.action(
								p.library.shell.world.action,
								invocation
							);
							events.fire("installed", p.destination.directory);
						} else {
							throw new Error("Unsupported: Docker installation on non-macOS system.");
						}
					} else {
						//	TODO	check for version conflict and decide what to do
						events.fire("found", p.destination.directory);
					}
				};
			},
			kubectl: kubectl
		});
	}
//@ts-ignore
)($api,$context,$loader,$export);
