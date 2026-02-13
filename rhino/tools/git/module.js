//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check

//	TODO	dates below are When
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.tools.git.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.jrunscript.tools.git.Exports } $exports
	 */
	function($api,$context,$loader,$exports) {
		var scripts = {
			/** @type { slime.jrunscript.tools.git.internal.log.Script } */
			log: $loader.script("log.js"),
			/** @type { slime.jrunscript.tools.git.internal.results.Script } */
			results: $loader.script("results.js"),
			/** @type { slime.jrunscript.tools.git.internal.commands.Script } */
			commands: $loader.script("commands.js"),
			/** @type { slime.jrunscript.tools.git.internal.oo.Script } */
			oo: $loader.script("oo.js"),
			/** @type { slime.jrunscript.tools.git.credentials.Script } */
			credentials: $loader.script("git-credential-tokens-directory.js")
		};

		var log = scripts.log({
			library: {
				time: $context.api.time
			}
		});

		var library = {
			log: log,
			results: scripts.results(),
			commands: scripts.commands({
				log: log
			}),
			credentials: scripts.credentials({
				library: {
					file: $context.api.file,
					shell: $context.api.shell
				}
			})
		}

		$exports.log = {
			format: library.log.format
		};

		var oo = scripts.oo({
			api: {
				java: $context.api.java,
				js: $context.api.js,
				shell: $context.api.shell
			},
			library: library,
			console: $context.console,
			environment: $context.environment
		});

		/** @type { (environment: Parameters<slime.jrunscript.tools.git.Exports["Installation"]>[0] ) => slime.jrunscript.tools.git.Installation } */
		$exports.Installation = function(environment) {
			return new oo.Installation(environment);
		}

		$exports.credentialHelper = {};

		(function() {
			var program = (function() {
				var find = function(api) {
					return $context.api.shell.PATH.getCommand("git");
				};

				if ($context.program) return $context.program;
				return find();
			})();

			if (program) {
				var installation = new oo.Installation({
					program: program
				});

				$exports.installation = installation;

				$exports.oo = {
					daemon: void(0),
					Repository: void(0),
					init: void(0),
					execute: void(0)
				};

				["daemon","Repository","init","execute"].forEach(function(name) {
					$exports.oo[name] = function() {
						return installation[name].apply(installation,arguments);
					};
				},this);
			}
		})();

		var GUI = $api.Error.old.Type({
			name: "GUIInstallRequired"
		});

		$exports.install = Object.assign(
			$api.events.Function(
				function(p,events) {
					var console = function(message) {
						events.fire("console", message);
					};
					if (!$exports.installation) {
						if ($context.api.shell.os.name == "Mac OS X") {
							console("Detected OS X " + $context.api.shell.os.version);
							console("Install Apple's command line developer tools.");
							$context.api.shell.run({
								command: "/usr/bin/git",
								stdio: {
									output: null,
									error: null
								},
								evaluate: function(result) {
									//	Do nothing; exit status will be 1
									throw new GUI("Please execute the graphical installer for the command line developer tools to install git.");
								}
							});
						} else if ($context.api.shell.os.name == "Linux") {
							console("Installing git using apt ...");
							if ($context.api.shell.PATH.getCommand("apt")) {
								$context.api.shell.run({
									command: "sudo",
									arguments: [
										"apt", "install", "git", "-y"
									]
								});
							} else {
								throw new Error("Unimplemented: installation of Git for Linux system without 'apt'.");
							}
						} else {
							throw new Error("Unimplemented: installation of Git for non-OS X, non-Linux system.");
						}
					} else {
						console("Git already installed.");
					}
				}
			), {
				GUI: GUI
			}
		);

		$exports.Client = {
			invocation: function(p) {
				/** @type { slime.jrunscript.shell.invocation.Argument } */
				var rv = {
					command: p.client.command.toString(),
					arguments: $api.Array.build(function(rv) {
						rv.push(p.invocation.command);
						if (p.invocation.arguments) rv.push.apply(rv, p.invocation.arguments);
					})
				};
				return $context.api.shell.Invocation.from.argument(rv);
			}
		};

		$exports.commands = library.commands;

		/**
		 * @param { slime.jrunscript.tools.git.Program } program
		 * @param { slime.jrunscript.tools.git.world.Config } config
		 * @param { slime.jrunscript.tools.git.Invocation } invocation
		 * @param { string } pathname
		 * @param { slime.jrunscript.shell.invocation.Argument["stdio"] } stdio
		 * @returns { slime.jrunscript.shell.run.minus2.Invocation }
		 */
		var createShellInvocation = function(program,config,pathname,invocation,stdio) {
			return $context.api.shell.Invocation.from.argument({
				command: program.command,
				arguments: $api.Array.build(function(rv) {
					for (var name in config) {
						rv.push("-c", name + "=" + config[name]);
					}
					rv.push(invocation.command);
					if (invocation.arguments) invocation.arguments.forEach(function(argument) {
						rv.push(argument);
					});
				}),
				stdio: stdio,
				directory: pathname
			});
		}

		/**
		 * @template { any } P
		 * @template { any } R
		 * @param { slime.jrunscript.tools.git.world.Invocation<P,R> } p
		 */
		var shell = function(p) {
			var invocation = p.command.invocation(p.argument);
			/** @type { slime.jrunscript.shell.invocation.Argument["stdio"] } */
			var stdio = {
				output: (p.stdout) ? "line" : "string",
				error: (p.stderr) ? "line" : void(0)
			}
			return createShellInvocation(p.program, p.config, p.pathname, invocation, stdio);
		}

		var toOldWorldOrientedApi = function(invocation) {
			return function(handler) {
				$api.fp.world.now.action(
					$context.api.shell.world.action,
					invocation,
					handler
				);
			}
		}

		/** @type { slime.jrunscript.tools.git.Exports["run"] } */
		var run = function(p) {
			var shellInvocation = shell(p);
			var output;
			//	TODO	need to change the type of p.world.run to the current wo API and then refactor
			//			toOldWorldOrientedApi (it might be just removed)
			var run = (p.world && p.world.run) ? p.world.run : toOldWorldOrientedApi;
			run(shellInvocation)({
				stdout: function(e) {
					p.stdout(e.detail.line);
				},
				stderr: function(e) {
					p.stderr(e.detail.line);
				},
				exit: function(e) {
					if (e.detail.status) throw new Error(
						"Exit status: " + e.detail.status
						+ " running: " + shellInvocation.configuration.command + " " + shellInvocation.configuration.arguments.join(" ")
					);
					output = e.detail.stdio.output;
				}
			});
			return (p.command.result) ? p.command.result(output) : void(0);
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.git.Program } program
		 * @param { slime.jrunscript.tools.git.world.Config } values
		 * @param { string } pathname
		 * @returns
		 */
		var commandExecutor = function(program,values,pathname) {
			return function(command) {
				return {
					argument: function(a) {
						return {
							run: function(p) {
								/** @type { slime.jrunscript.tools.git.world.Invocation } */
								var bound = {
									program: program,
									config: values,
									pathname: pathname,
									command: command,
									argument: a,
									stderr: void(0),
									stdout: void(0),
									world: void(0)
								};
								var specified = $api.Object.compose(bound, p);
								return run(specified);
							}
						}
					}
				}
			};
		};

		/** @type { slime.jrunscript.tools.git.Command<void,slime.jrunscript.tools.git.submodule.Configuration[]> } */
		var submoduleConfiguration = {
			invocation: function() {
				return {
					command: "config",
					arguments: ["--file", ".gitmodules", "--list"]
				}
			},
			result: $api.fp.pipe(
				library.results.config.list,
				function(config) {
					return config.reduce(function(rv,setting) {
						var tokens = setting.name.split(".");
						if (tokens[0] != "submodule") throw new TypeError("Not submodule: " + setting.name);
						var name = tokens[1];
						var property = tokens[2];
						if (!rv[name]) rv[name] = {};
						rv[name][property] = setting.value;
						return rv;
					}, {});
				},
				//	The reduce step above seems to be a useful way to group the values together by name; now we'll explode them
				//	back into an array.
				function(object) { return Object.entries(object); },
				$api.fp.Array.map(function(entry) {
					return $api.Object.compose(
						{ name: entry[0] },
						entry[1]
					);
				})
			)
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.git.Program } program
		 * @param { { [name: string]: string; } } config
		 * @param { string } repository
		 * @returns { slime.jrunscript.tools.git.RepositoryView }
		 */
		var RepositoryView = function(program,config,repository) {
			var Invocation = function(p) {
				return {
					program: program,
					config: config,
					pathname: repository,
					command: p.command,
					argument: p.argument
				}
			};
			return {
				Invocation: Invocation,
				shell: function(invocation) {
					return createShellInvocation(
						program,
						config,
						repository,
						invocation.invocation,
						invocation.stdio
					);
				},
				command: commandExecutor(program,config,repository),
				run: function(p) {
					var invocation = $api.Object.compose(
						Invocation(p),
						{
							world: p.world
						}
					);
					return run(invocation)
				},
				gitmodules: function() {
					var gitmodulesExists = $api.fp.now.invoke(
						repository,
						$context.api.file.Location.from.os,
						$context.api.file.Location.directory.relativePath(".gitmodules"),
						$api.fp.world.mapping($context.api.file.Location.file.exists.world())
					);
					if (!gitmodulesExists) return [];
					var executor = commandExecutor(program, config, repository);
					return executor(submoduleConfiguration).argument().run();
				}
			};
		}

		$exports.program = function(program) {
			return {
				Invocation: function(p) {
					return {
						program: program,
						config: {},
						pathname: p.pathname,
						command: p.command,
						argument: p.argument
					}
				},
				config: function(values) {
					return {
						repository: function(pathname) {
							return RepositoryView(program,values,pathname);
						},
						command: commandExecutor(program, values, void(0))
					}
				},
				repository: function(pathname) {
					return RepositoryView(program,{},pathname);
				},
				command: commandExecutor(program,{},void(0))
			}
		}

		$exports.run = function(p) {
			return run($api.Object.compose(p, {
				run: toOldWorldOrientedApi
			}));
		};

		$exports.Invocation = {
			shell: function(p) {
				return createShellInvocation(p.program, {}, p.pathname, p.invocation, p.stdio);
			}
		}

		$exports.local = function(p) {
			var directory = p.start;
			while(directory) {
				if (directory && (directory.getSubdirectory(".git") || directory.getFile(".git"))) {
					var repository = $exports.oo.Repository({ directory: directory });
					var url = repository.remote.getUrl({ name: "origin" });
					var fullurl = $context.api.web.Url.parse(url);
					if (p.match(fullurl)) return directory;
				}
				directory = directory.parent;
			}
			return null;
		};

		$exports.credentials = library.credentials;
	}
//@ts-ignore
)($api,$context,$loader,$exports)
