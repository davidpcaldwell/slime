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
			/** @type { slime.jrunscript.tools.git.internal.commands.Script } */
			commands: $loader.script("commands.js")
		};

		var library = {
			log: scripts.log({
				library: {
					time: $context.api.time
				}
			}),
			commands: scripts.commands()
		}

		/** @type { new (environment: Parameters<slime.jrunscript.tools.git.Exports["Installation"]>[0] ) => slime.jrunscript.tools.git.Installation } */
		var Installation = function(environment) {

			//	Organized via https://git-scm.com/docs

			//	Setup and Config

			var cli = new function() {
				var addConfigurationArgumentsTo = function(array,config) {
					//	TODO	duplicated below, in git()
					if (config) {
						for (var x in config) {
							if (config[x] instanceof Array) {
								config[x].forEach(function(value) {
									array.push("-c", x + "=" + value);
								});
							} else {
								array.push("-c", x + "=" + config[x]);
							}
						}
					}
				};

				this.old = function(m) {
					return $context.api.shell.run(
						$api.Object.compose(m, {
							command: environment.program,
							arguments: $api.Array.build(function(rv) {
								addConfigurationArgumentsTo(rv,m.config);
								rv.push(m.command);
								rv.push.apply(rv, (m.arguments) ? m.arguments : []);
								return rv;
							}),
							environment: m.environment,
							directory: m.directory
						})
					);
				};

				this.command = function(m) {
					var program = environment.program;

					function commandImplementation(p,events) {
						var args = [];
						addConfigurationArgumentsTo(args,p.config);
						if (p.credentialHelper) {
							args.push("-c", "credential.helper=", "-c", "credential.helper=" + p.credentialHelper);
						} else if (p.credentialHelpers) {
							args.push("-c", "credential.helper=");
							p.credentialHelpers.forEach(function(helper) {
								args.push("-c", "credential.helper=" + helper);
							});
						}
						args.push(m.command);
						var r = $api.Object.compose(p, { _this: this });
						if (typeof(m.arguments) == "function") m.arguments.call(args,r);
						var environment = $api.Object.compose($context.api.shell.environment);
						if (m.environment) {
							var replaced = m.environment.call(environment, p);
							if (typeof(replaced) != "undefined") environment = replaced;
						}
						var stdio;
						if (m.stdio) stdio = m.stdio(p, events);
						return $context.api.shell.run({
							command: program,
							arguments: args,
							environment: environment,
							stdio: stdio,
							directory: p.directory,
							evaluate: (m.evaluate) ? function(result) {
								return m.evaluate($api.Object.compose(result, { argument: p }));
							} : m.evaluate
						}, {
							terminate: function(e) {
								//	way to dispatch
								events.fire("terminate", e.detail);
							}
						});
					}

					return $api.Events.Function(commandImplementation);
				};

				/**
				 *
				 * @param { slime.jrunscript.tools.git.internal.GitCommand } c
				 */
				this.gitCommand = function(c) {
					var program = environment.program;

					/**
					 *
					 * @param { slime.jrunscript.tools.git.internal.InvocationConfiguration } o
					 * @param { slime.jrunscript.tools.git.repository.Argument } p
					 * @param { any } events
					 */
					function invoke(o,p,events) {
						/** @type { string[] } */
						var args = [];
						addConfigurationArgumentsTo(args,p.config);
						if (p.credentialHelper) {
							args.push("-c", "credential.helper=", "-c", "credential.helper=" + p.credentialHelper);
						}
						args.push(c.name);
						if (o.arguments) args = $api.Function.impure.revise(o.arguments(p))(args);
						//	TODO	this type should be in rhino/shell if it is not already
						/** @type { slime.jrunscript.tools.git.internal.Environment } */
						var environment = $api.Object.compose($context.environment);
						if (o.environment) environment = $api.Function.impure.revise(o.environment(p))(environment);

						var output = {
							stdout: [],
							stderr: []
						};

						var result = $context.api.shell.run({
							command: program,
							arguments: args,
							environment: environment,
							stdio: {
								output: {
									line: function(line) {
										output.stdout.push(line);
										if (events) events.fire("stdout", line);
									}
								},
								error: {
									line: function(line) {
										output.stderr.push(line);
										if (events) events.fire("stderr", line);
									}
								}
							},
							directory: p.directory
						});

						var createReturnValue = (o.createReturnValue) ? o.createReturnValue(p) : $api.Function.returning(void(0));

						return createReturnValue({ output: output, result: result });
					}

					function execute(p, events) {
						var configuration = c.configure(p);
						return invoke(configuration, p, events);
					}

					return execute;
				}

				this.stdio = new function() {
					/**
					 * @param { any } [o]
					 */
					this.Events = function(o) {
						if (!o) o = {};
						return function(p, events) {
							return {
								output: {
									line: function(line) {
										events.fire("stdout", line);
										if (o.output) o.output(line);
									}
								},
								error: {
									line: function(line) {
										events.fire("stderr", line);
										if (o.error) o.error(line);
									}
								}
							}
						}
					}
				}
			};

			var git = cli.old;

			var configFile = {
				/**
				 *
				 * @param { slime.jrunscript.tools.git.internal.Result } result
				 * @returns { { name: string, value: string }[] }
				 */
				parseResult: function(result) {
					return result.output.stdout.filter(Boolean).map(function(line) {
						//	TODO	what if value contains equals? Does the below work?
						var tokens = line.split("=");
						if (!tokens[0]) $context.console("line: [" + line + "] " + " tokens=" + JSON.stringify(tokens));
						return { name: tokens[0], value: tokens.slice(1).join("=") }
					});
				}
			};

			var config = cli.gitCommand({
				name: "config",
				configure: function(p) {
					if (p.arguments && (p.arguments.indexOf("--list") != -1 || p.arguments.indexOf("-l") != -1)) {
						return {
							arguments: function(p) {
								return function(array) {
									array.push.apply(array,p.arguments);
								}
							},
							createReturnValue: function(p) {
								return function(result) {
									return $api.Object({
										properties: result.output.stdout.map(function(line) {
											var token = line.split("=");
											return { name: token[0], value: token[1] }
										})
									});
								}
							}
						}
					} else if (p.arguments && p.arguments.indexOf("--add") != -1) {
						return {
							arguments: function(p) {
								return function(array) {
									array.push.apply(array,p.arguments);
								}
							}
						}
					} else if (p.arguments) {
						return $api.deprecate(function() {
							return {
								arguments: function(p) {
									return function(array) {
										array.push.apply(array,p.arguments);
									}
								}
							}
						})();
					} else if (p.list) {
						return {
							arguments: function(p) {
								return function(array) {
									array.push("--list");
									if (typeof(p.list.fileOption) == "string") {
										array.push("--" + p.list.fileOption);
									} else if (typeof(p.list.fileOption) == "undefined") {
										//	TODO	there is no test for this
									} else {
										throw new TypeError("Unimplemented: non-string fileOption");
									}
								}
							},
							createReturnValue: function(p) {
								return configFile.parseResult;
							}
						}
					} else if (p.set) {
						return {
							arguments: function(p) {
								return function(array) {
									array.push(p.set.name, p.set.value);
								}
							}
						}
					} else {
						throw new Error("Unrecognized config argument type");
					}
				}
			});

			//	help

			//	Getting and Creating Projects

			/** @type { slime.jrunscript.tools.git.Installation["init"] } */
			var init = $api.Events.Function(function(m,events) {
				git({
					command: "init",
					arguments: [m.pathname],
					stdio: cli.stdio.Events()(void(0), events)
				});
				return new LocalRepository({
					directory: m.pathname.directory
				});
			});

			/** @type { slime.jrunscript.tools.git.Repository["clone"] } */
			var clone = cli.command({
				command: "clone",
				arguments: function(p) {
					if (!p.to) {
						throw new Error("Required: 'to' property indicating destination.");
					}
					if (p.recurseSubmodules) this.push("--recurse-submodules");
					//	TODO	no test coverage for branch option
					if (p.branch) this.push("--branch", p.branch);
					this.push(p._this.reference, p.to.toString());
				},
				stdio: cli.stdio.Events(),
				evaluate: function(result) {
					if (result.status) throw new Error("git clone failed.");
					return new LocalRepository({ directory: result.argument.to.directory });
				}
			});

			//	Basic Snapshotting

			var add = function(p) {
				git({
					command: "add",
					arguments: (function() {
						var rv = [];
						if (p.path) {
							rv.push(p.path);
						}
						if (p.paths) {
							rv.push.apply(rv,p.paths);
						}
						return rv;
					})(),
					directory: p.directory
				});
			};

			var commit = cli.command({
				command: "commit",
				arguments: function(p) {
					if (!p.message) {
						throw new TypeError("Required: message property containing commit message");
					}
					if (p.all) {
						this.push("--all");
					}
					if (p.noVerify) {
						this.push("--no-verify");
					}
					this.push("--message", p.message);
					if (p.author) {
						this.push("--author=" + p.author);
					}
				},
				stdio: cli.stdio.Events()
			});

			var rm = cli.command({
				command: "rm",
				arguments: function(p) {
					if (p.path) this.push(p.path);
				}
			});

			//	Branching and Merging

			//	Sharing and Updating Projects

			var StdioDispatcher = function(o) {
				return {
					output: {
						line: function(line) {
							if (o.output) o.output(line, o.events);
						}
					},
					error: {
						line: function(line) {
							if (o.error) o.error(line, o.events);
						}
					}
				}
			};

			/**
			 * @type { slime.jrunscript.tools.git.repository.Local["fetch"] }
			 */
			var fetch = cli.command({
				command: "fetch",
				arguments: function(p) {
					if (p && p.all) {
						this.push("--all");
						if (p && p.prune) {
							this.push("--prune");
						}
						if (p && p.recurseSubmodules) {
							if (typeof(p.recurseSubmodules) == "string") {
								this.push("--recurse-submodules=" + p.recurseSubmodules);
							} else {
								this.push("--recurse-submodules");
							}
						}
					}
				},
				stdio: function(p, events) {
					if (p.stdio) return p.stdio;
					return StdioDispatcher({
						events: events,
						output: function(line, events) {
							var fetchingRemote = /Fetching (.*)/;
							if (fetchingRemote.test(line)) {
								events.fire("remote", fetchingRemote.exec(line)[1])
							} else {
								events.fire("stdout_other", line);
							}
							events.fire("stdout", line);
						},
						error: function(line, events) {
							var fetchingSubmodule = /Fetching submodule (.*)/;
							if (fetchingSubmodule.test(line)) {
								events.fire("submodule", fetchingSubmodule.exec(line)[1])
							} else {
								events.fire("stderr_other", line);
							}
							events.fire("stderr", line);
						}
					});
				}
			});

			var remote = {};
			remote.getUrl = cli.command({
				command: "remote",
				arguments: function(p) {
					this.push("get-url");
					this.push(p.name);
				},
				stdio: function(p) {
					return {
						output: String
					}
				},
				evaluate: function(result) {
					return result.stdio.output.split("\n")[0];
				}
			});

			var submodule = cli.command({
				command: "submodule",
				arguments: function(p) {
					if (p.cached) {
						this.push("--cached");
					}
					//	quiet
				},
				stdio: function(p) {
					return {
						output: String
					}
				},
				evaluate: function(result) {
					var linePattern = /(?:\s*)(\+?)(\S+)(?:\s+)(\S+)((?:\s+)\((\S+)\))?/;
					return result.stdio.output.split("\n").filter(function(line) {
						return line;
					}).map(function(line) {
						var parsed = linePattern.exec(line);
						if (!parsed) throw new Error("No match in submodule evaluate: [" + line + "] in\n" + result.stdio.output);
						//	parsed[1] is a plus sign sometimes
						var commit = parsed[2];
						var path = parsed[3];
						//	parsed[4] is git describe; see https://git-scm.com/docs/git-submodule
						return {
							commit: commit,
							path: path
						}
					})
				}
			});
			var submodule_add = cli.command({
				command: "submodule",
				arguments: function(p) {
					this.push("add");
					if (p.name) {
						this.push("--name", p.name);
					}
					if (p.branch) {
						this.push("-b", p.branch);
					}
					this.push(p.repository.reference);
					this.push(p.path);
				},
				stdio: cli.stdio.Events(),
				evaluate: function(result) {
					return new LocalRepository({ directory: result.directory.getSubdirectory(result.argument.path) });
				}
			});
			var submodule_update = cli.command({
				command: "submodule",
				arguments: function(p) {
					this.push("update");
					if (p.init) this.push("--init");
					if (p.recursive) this.push("--recursive");
				}
			});
			var submodule_deinit = cli.command({
				command: "submodule",
				arguments: function(p) {
					this.push("deinit");
					if (p.force) this.push("--force");
					if (p.path) this.push(p.path);
				}
			});

			//	Inspection and Comparison

			//	Patching

			//	Debugging

			//	Guides

			//	Email

			//	External Systems

			//	Administration

			//	Server Admin

			//	Plumbing Commands

			/**
			 * @type { new ({}) => slime.jrunscript.tools.git.Repository }
			 */
			var Repository = function(o) {
				//	Getting and Creating Projects
				/** @type { string } */
				this.reference = void(0);

				/** @property { string } reference */

				this.clone = clone;
			};

			/**
			 * @type { new ({}) => slime.jrunscript.tools.git.Repository }
			 */
			var RemoteRepository = function(o) {
				Repository.call(this,o);

				this.clone = this.clone;

				this.toString = function() {
					return "git remote: " + o.remote;
				}

				this.reference = o.remote;
			};

			//	TODO	standardize
			var addDeprecatedPropertyAlias = function(p) {
				Object.defineProperty(p.target, p.name, {
					get: function() {
						return this[p.property];
					},
					enumerable: p.enumerable
				});
			};

			/**
			 * @type { new (o: any) => slime.jrunscript.tools.git.repository.Local }
			 */
			var LocalRepository = function LocalRepository(o) {
				Repository.call(this,o);

				var directory = (function() {
					if (o.directory) return o.directory;
					if (o.local) return $api.deprecate(function() {
						return o.local;
					})();
					throw new TypeError("Required: .directory property.");
				})();

				var command = function(f) {
					return function localRepositoryCommand(p, events) {
						return f($api.Object.compose(p, { directory: directory }), events);
					}
				}

				this.reference = directory.pathname.toString();

				this.clone = this.clone;

				this.directory = directory;

				addDeprecatedPropertyAlias({
					target: this,
					name: "base",
					property: "directory"
				});

				this.toString = function() {
					return "git local: " + directory;
				};

				["getRelativePath","getFile","getSubdirectory"].forEach(function(method) {
					this[method] = function() {
						return directory[method].apply(directory,arguments);
					}
				},this);

				var execute = function(p) {
					return git($api.Object.compose(p, {
						environment: $context.api.js.Object.set({}, $context.api.shell.environment, (o && o.environment) ? o.environment : {}, (p.environment) ? p.environment : {}),
						directory: directory
					}));
				};

				var formats = {
					log: {
						format: library.log.format.mask,
						parse: library.log.format.parse
					}
				};

				$exports.log = {
					format: library.log.format
				}

				/** @type { slime.jrunscript.tools.git.repository.Local["show"] } */
				var show = function(p) {
					return execute({
						command: "show",
						//	Some sources say to use undocumented --quiet: see https://stackoverflow.com/questions/1828252/how-to-display-metainformation-about-single-commit-in-git
						arguments: (function(rv) {
							rv.push("-s");
							rv.push("--format=format:" + formats.log.format);
							if (p.object) rv.push(p.object, "--");
							return rv;
						})([]),
						stdio: {
							output: String,
							error: String
						}
						,evaluate: function(result) {
							if (result.status == 128) return null;
							if (result.status) {
								throw new Error(result.stdio.error);
							}
							return formats.log.parse(result.stdio.output.split("\n")[0]);
						}
					});
				};

				//	Organization of commands mirrors organization on https://git-scm.com/docs

				//	Setup and Config

				/** @type { slime.jrunscript.tools.git.repository.Local["config"] } */
				this.config = command(config);

				//	Getting and Creating Projects

				//	Basic Snapshotting

				this.add = function(p) {
					add($api.Object.compose(p, { directory: directory }));
				};

				this.rm = command(rm);

				/** @type { ( () => void ) & { getUrl: ({ name: string }) => string } }} */
				var myremote = function() {
					throw new Error("Unimplemented: remote");
				};
				myremote.getUrl = command(remote.getUrl);
				this.remote = myremote;

				/** @type { slime.jrunscript.tools.git.repository.Local["status"] } */
				this.status = function() {
					var self = this;
					var input = library.commands.status.invocation();
					return execute({
						command: input.command,
						arguments: input.arguments,
						stdio: {
							output: String
						},
						/**
						 *
						 * @param { { stdio: { output: string } } } result
						 * @returns { ReturnType<slime.jrunscript.tools.git.repository.Local["status"]> }
						 */
						evaluate: function(result) {
							//	TODO	This ignores renamed files; see git help status
							var parsed = library.commands.status.result(result.stdio.output);
							return {
								branch: {
									name: parsed.branch,
									current: true,
									commit: self.show({ object: (parsed.branch == null) ? "HEAD" : parsed.branch })
								},
								paths: parsed.paths
							}
						}
					});
				};

				/** @type { slime.jrunscript.tools.git.repository.Local["commit"] } */
				this.commit = command(commit);

				//	Branching and Merging

				/**
				 * @param { string } output
				 * @returns { slime.jrunscript.tools.git.Branch[] }
				 */
				var toBranchList = function(output) {
					return output.split("\n")
						.filter(function(line) { return line; })
						.filter(function(line) { return line.indexOf(" -> ") == -1 })
						.map(function(line) {
							var status = line.substring(0,1);
							var name = line.substring(2);
							var detachedHeadPattern = /^\(HEAD detached (at|from) (.*)\)/;
							var noBranchName = "(no branch)";
							var toShow;
							if (detachedHeadPattern.test(name) || name == noBranchName) {
								toShow = "HEAD";
								name = null;
							} else {
								toShow = name;
							}
							return {
								current: status == "*",
								name: name,
								commit: show({ object: toShow })
							};
						})
					;
				}

				/**
				 * @param { { remotes?: boolean, remote?: boolean, all?: boolean } } p
				 * @returns { slime.jrunscript.tools.git.Branch[] }
				 */
				var branchList = function(p) {
					var args = [];
					if (p.remotes || p.remote) {
						args.push("-r");
					}
					if (p.all) {
						args.push("-a");
					}
					return execute({
						command: "branch",
						arguments: args,
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return toBranchList(result.stdio.output);
						}
					})
				};

				/**
				 * @returns { slime.jrunscript.tools.git.Branch }
				 */
				var currentBranch = function() {
					return execute({
						command: "branch",
						arguments: args,
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return toBranchList(result.stdio.output).filter(function(branch) {
								return branch.current;
							})[0];
						}
					})
				};

				/**
				 * @param { { name: string, force?: boolean, start?: string, startPoint?: string } } p
				 */
				var modifyBranch = function(p) {
					var args = [];
					if (p.force) args.push("--force");
					args.push(p.name);
					if (p.startPoint) {
						args.push(p.startPoint);
					} else if (p.start) {
						$api.deprecate(function() {
							args.push(p.start);
						})();
					}
					return execute({
						command: "branch",
						arguments: args
					});
				}

				/**
				 * @param { { delete: string, force?: boolean } } p
				 */
				var deleteBranch = function(p) {
					var args = ["--delete", p.delete];
					if (p.force) args.push("--force");
					return execute({
						command: "branch",
						arguments: args
					});
				};

				this.branch = function(p) {
					if (!p) p = {};
					if (p.name && p.delete === true) {
						$api.deprecate(function() {
							deleteBranch({ delete: p.name });
						})();
					} else if (p.name) {
						modifyBranch(p);
					} else if (p.delete) {
						//	TODO	can supply an array here on the git command
						return deleteBranch(p);
					} else if (p.old) {
						return currentBranch();
					} else {
						return branchList(p);
					}
				};

				/** @type { slime.jrunscript.tools.git.repository.Local["checkout" ] } */
				this.checkout = function(p) {
					var args = [];
					args.push(p.branch);
					execute($context.api.js.Object.set({
						command: "checkout",
						arguments: args
					}, (p.stdio) ? { stdio: p.stdio } : {}));
				};

				/** @type { slime.jrunscript.tools.git.repository.Local["merge"] } */
				this.merge = function(p) {
					var args = [];
					if (p.noCommit) {
						args.push("--no-commit");
					}
					if (p.ffOnly) {
						args.push("--ff-only");
					} else if (p.noFf) {
						args.push("--no-ff");
					} else if (p["ff_only"]) {
						$api.deprecate(function() {
							args.push("-ff-only");
						})();
					}
					args.push(p.name);
					execute($context.api.js.Object.set({
						command: "merge",
						arguments: args
					}, (p.stdio) ? { stdio: p.stdio } : {}));
				};

				//	log() in "Inspection and Comparison" below

				/** @type { Function & { list: Function } } */
				var stash = function(p) {
					if (!p) p = {};
					execute({
						command: "stash"
					});
				};
				stash.list = (function(p) {
					if (!p) p = {};
					return execute({
						command: "stash",
						arguments: ["list"],
						stdio: {
							output: String
						},
						evaluate: function(result) {
							//	TODO	would this work on Windows?
							return result.stdio.output.split("\n").slice(0,-1).map(function(line) {
								return { line: line }
							});
						}
					});
				}).bind(this);
				this.stash = stash;

				//	Sharing and Updating Projects

				/** @type { slime.jrunscript.tools.git.repository.Local["fetch"] } */
				this.fetch = command(fetch);

				this.push = (
					/** @param { Parameters<slime.jrunscript.tools.git.repository.Local["push"]>[0] } p */
					function(p) {
						var args = [];
						if (p && p.delete) args.push("--delete");
						//jsh.shell.console("Setting upstream ...");
						if (p && p.setUpstream) args.push("--set-upstream", p.setUpstream);
						if (p && p.all) args.push("--all");
						if (p && p.repository) args.push(p.repository);
						if (p && p.refspec) args.push(p.refspec);
						//jsh.shell.console("push " + args.join(" "));
						execute({
							config: p.config,
							command: "push",
							arguments: args,
							environment: p.environment
						});
					}
				);

				var getSubmoduleConfiguration = function() {
					if (directory.getFile(".gitmodules")) {
						var settingsCommand = cli.gitCommand({
							name: "config",
							configure: function(p) {
								return {
									arguments: function(p) {
										return function(array) {
											array.push("--file", directory.getFile(".gitmodules"));
											array.push("--list");
										}
									},
									createReturnValue: function(p) {
										return configFile.parseResult;
									}
								}
							}
						});
						/** @type { { name: string, value: string }[] } */
						var settings = settingsCommand({});
						return $api.Function.result(
							settings,
							function(settings) {
								return settings.reduce(function(rv,setting) {
									var tokens = setting.name.split(".");
									if (tokens[0] != "submodule") throw new TypeError("Not submodule: " + setting.name);
									var name = tokens[1];
									var property = tokens[2];
									if (!rv[name]) rv[name] = {};
									rv[name][property] = setting.value;
									return rv;
								}, {});
							},
							Object.entries,
							$api.Function.Array.map(function(entry) {
								return $api.Object.compose({
									name: entry[0]
								}, entry[1])
							})
						);
					} else {
						return null;
					}
				}

				/** @type { slime.jrunscript.tools.git.repository.Local["submodule"] } */
				this.submodule = Object.assign(function(p) {
					if (!p) p = {};
					if (!p.command) {
						var submoduleConfiguration = getSubmoduleConfiguration();

						var getConfiguration = function(path) {
							return submoduleConfiguration.find(function(item) {
								return item.path == path;
							});
						}

						return (submoduleConfiguration) ? command(submodule)(p).map(function(line) {
							//	commit, path
							var subdirectory = directory.getSubdirectory(line.path);
							if (!subdirectory) throw new Error("directory=" + directory + " path=" + line.path);
							var sub = new LocalRepository({ directory: subdirectory });
							var shown = sub.show({ object: line.commit });
							return $api.Object.compose(getConfiguration(line.path), {
								repository: sub,
								commit: shown
							});
						}) : [];
					}
					if (p.command == "update") {
						execute({
							config: p.config,
							command: "submodule",
							arguments: (function() {
								var rv = [];
								rv.push(p.command);
								if (p.init) {
									rv.push("--init");
								}
								if (p.recursive) {
									rv.push("--recursive");
								}
								return rv;
							})()
						})
					} else if (p.command == "sync") {
						execute({
							config: p.config,
							command: "submodule",
							arguments: ["sync"]
						});
					}
				}, {
					add: command(submodule_add),
					update: command(submodule_update),
					deinit: command(submodule_deinit)
				});

				this.push = function(p) {
					var args = [];
					if (p && p.delete) args.push("--delete");
					//jsh.shell.console("Setting upstream ...");
					if (p && p.setUpstream) args.push("--set-upstream", p.setUpstream);
					if (p && p.all) args.push("--all");
					if (p && p.repository) args.push(p.repository);
					if (p && p.refspec) args.push(p.refspec);
					//jsh.shell.console("push " + args.join(" "));
					execute({
						config: p.config,
						command: "push",
						arguments: args,
						environment: p.environment
					});
				};

				//	Inspection and Comparison

				this.show = function(p) {
					if (!p) p = {};
					return show(p);
				};

				/** @type { slime.jrunscript.tools.git.repository.Local["log"] } */
				this.log = function(p) {
					if (!p) p = {};

					/**
					 *  @typedef { object } deprecatedRange
					 *  @property { string } since
					 *  @property { string } until
					 */

					/** @type { (p: any) => p is deprecatedRange } */
					function isDeprecatedRange(p) {
						return typeof(p.since) == "string" && typeof(p.until) == "string";
					}

					return execute({
						command: "log",
						arguments: (function() {
							var rv = [];
							rv.push("--format=format:" + formats.log.format);
							if (isDeprecatedRange(p)) {
								var x = p;
								$api.deprecate(function() {
									rv.push(x.since+".."+x.until);
									rv.push("--");
								})();
							} else if (typeof(p.range) == "string") {
								$api.deprecate(function() {
									rv.push(p.range);
								})();
								rv.push(p.range);
							} else if (typeof(p.revisionRange) == "string") {
								rv.push(p.revisionRange);
							}
							if (p && p.author) {
								rv.push("--author=" + p.author);
							}
							if (p && p.all) {
								rv.push("--all");
							}
							return rv;
						})()
						,stdio: {
							output: String,
							error: String
						}
						,evaluate: function(result) {
							if (result.status != 0) {
								var lines = result.stdio.error.split("\n");
								if (lines[0].indexOf("does not have any commits yet") != -1) {
									return [];
								}
								return null;
							}
							return result.stdio.output.split("\n").map(function(line) {
								if (line.length == 0) return null;
								return formats.log.parse(line);
							}).filter(function(commit) {
								return Boolean(commit && commit.subject);
							});
						}
					});
				};

				//	Patching

				//	Debugging

				//	(Guides)

				//	Email

				//	External Systems

				//	Administration

				//	Server Admin

				//	.daemon() see below

				//	Plumbing Commands

				this.mergeBase = function(p) {
					var args = [];
					args = args.concat(p.commits);
					return execute({
						command: "merge-base",
						arguments: args,
						stdio: {
							output: String
						},
						evaluate: function(result) {
							if (result.status == 0) {
								var rv = (/^(\S+)/.exec(result.stdio.output))[1];
								if (!rv) {
									throw new Error("No match: [" + result.stdio.output + "]");
								}
								return show({ object: rv });
								//return result.stdio.output;
							} else {
								throw new Error("git exited with status " + result.status);
							}
						}
					})
				};

				//	Interface for custom commands or commands not implemented

				this.execute = function(p) {
					return execute(p);
				}
			};

			this.init = init;

			//	Server Admin

			/** @type { slime.jrunscript.tools.git.Installation["daemon"] } */
			this.daemon = function(p) {
				var DEFAULT_GIT_PORT = 9418;

				var args = [];
				if (typeof(p.port) == "number") args.push("--port=" + p.port);
				if (p.basePath) args.push("--base-path=" + p.basePath);
				if (p.exportAll) args.push("--export-all");
				var lock = new $context.api.java.Thread.Monitor();
				var process;
				$context.api.java.Thread.start(function() {
					git({
						command: "daemon",
						arguments: args,
						on: {
							start: function(e) {
								lock.Waiter({
									until: function() {
										return true;
									},
									then: function() {
										process = e;
									}
								})()
							}
						}
					});
				});
				lock.Waiter({
					until: function() {
						return process;
					},
					then: function() {
					}
				})();
				return new function() {
					this.port = (p.port) ? p.port : DEFAULT_GIT_PORT;

					this.basePath = p.basePath;

					this.kill = function() {
						process.kill();
					}
				}
			}

			/** @type { (p: any) => p is slime.jrunscript.tools.git.repository.argument.Directory } */
			var isDirectoryArgument = function(p) {
				return Boolean(p.directory);
			}

			/** @type { (p: any) => p is slime.jrunscript.tools.git.repository.argument.Local } */
			var isLocalArgument = function(p) {
				return Boolean(p.local);
			}

			/** @type { (p: any) => p is slime.jrunscript.tools.git.repository.argument.Remote } */
			var isRemoteArgument = function(p) {
				return Boolean(p.remote);
			}

			/** @type { slime.jrunscript.tools.git.Installation["Repository"] } */
			//	TODO	disabled to support upgrade to TypeScript 4.5.4 and Typedoc 0.22.11
			//@ts-ignore
			this.Repository = (
				function(p) {
					if (isDirectoryArgument(p) || isLocalArgument(p)) {
						return new LocalRepository(p);
					} else if (isRemoteArgument(p)) {
						return new RemoteRepository(p);
					} else {
						throw new TypeError("Required: .directory, .local, or .remote property.");
					}
				}
			);

			/** @type { slime.jrunscript.tools.git.Installation["execute"] } */
			this.execute = function(m) {
				git(m);
			}
		};

		/** @type { (environment: Parameters<slime.jrunscript.tools.git.Exports["Installation"]>[0] ) => slime.jrunscript.tools.git.Installation } */
		$exports.Installation = function(environment) {
			return new Installation(environment);
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
				var installation = new Installation({
					program: program
				});

				$exports.installation = installation;

				["daemon","Repository","init","execute"].forEach(function(name) {
					$exports[name] = function() {
						return installation[name].apply(installation,arguments);
					};
				},this);
			}
		})();

		var GUI = $api.Error.Type({
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
				/** @type { slime.jrunscript.shell.invocation.old.Argument } */
				var rv = {
					command: p.client.command,
					arguments: $api.Array.build(function(rv) {
						rv.push(p.invocation.command);
						if (p.invocation.arguments) rv.push.apply(rv, p.invocation.arguments);
					})
				};
				return $context.api.shell.Invocation.old(rv);
			}
		};

		$exports.commands = library.commands;

		/**
		 * @param { slime.jrunscript.tools.git.Program } program
		 * @param { slime.jrunscript.tools.git.Invocation } invocation
		 * @param { string } pathname
		 * @param { slime.jrunscript.shell.invocation.Argument["stdio"] } stdio
		 * @returns { slime.jrunscript.shell.run.Invocation }
		 */
		var createShellInvocation = function(program,pathname,invocation,stdio) {
			return $context.api.shell.Invocation.create({
				command: program.command,
				arguments: $api.Array.build(function(rv) {
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
			return createShellInvocation(p.program, p.pathname, invocation, stdio);
		}

		/** @type { slime.jrunscript.tools.git.Exports["run"] } */
		var run = function(p) {
			var shellInvocation = shell(p);
			var output;
			var run = (p.world && p.world.run) ? p.world.run : $context.api.shell.world.run;
			run(shellInvocation)({
				stdout: function(e) {
					p.stdout(e.detail.line);
				},
				stderr: function(e) {
					p.stderr(e.detail.line);
				},
				exit: function(e) {
					if (e.detail.status) throw new Error("Exit status: " + e.detail.status);
					output = e.detail.stdio.output;
				}
			});
			return (p.command.result) ? p.command.result(output) : void(0);
		};

		var commandExecutor = function(program,pathname) {
			return function(command) {
				return {
					argument: function(a) {
						return {
							run: function(p) {
								/** @type { slime.jrunscript.tools.git.world.Invocation } */
								var bound = {
									program: program,
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
		}

		$exports.program = function(program) {
			return {
				Invocation: function(p) {
					return {
						program: program,
						pathname: p.pathname,
						command: p.command,
						argument: p.argument
					}
				},
				repository: function(pathname) {
					var Invocation = function(p) {
						return {
							program: program,
							pathname: pathname,
							command: p.command,
							argument: p.argument
						};
					}
					return {
						Invocation: Invocation,
						shell: function(invocation) {
							return createShellInvocation(
								program,
								pathname,
								invocation.invocation,
								invocation.stdio
							);
						},
						command: commandExecutor(program,pathname),
						run: function(p) {
							var invocation = $api.Object.compose(
								Invocation(p),
								{
									world: p.world
								}
							);
							return run(invocation)
						}
					}
				},
				command: commandExecutor(program,void(0))
			}
		}

		$exports.run = function(p) {
			return run($api.Object.compose(p, {
				run: $context.api.shell.world.run
			}));
		};

		$exports.Invocation = {
			shell: function(p) {
				return createShellInvocation(p.program, p.pathname, p.invocation, p.stdio);
			}
		}

		$exports.local = function(p) {
			var directory = p.start;
			while(directory) {
				if (directory && (directory.getSubdirectory(".git") || directory.getFile(".git"))) {
					var repository = $exports.Repository({ directory: directory });
					var url = repository.remote.getUrl({ name: "origin" });
					var fullurl = $context.api.web.Url.parse(url);
					if (p.match(fullurl)) return directory;
				}
				directory = directory.parent;
			}
			return null;
		}
	}
//@ts-ignore
)($api,$context,$loader,$exports)
