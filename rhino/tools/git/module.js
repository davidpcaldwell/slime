//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check

//	TODO	dates below are When

void(0);

(
	/**
	 * @param { slime.jrunscript.git.Context } $context
	 * @param { slime.jrunscript.git.Exports } $exports
	 */
	function($context,$exports) {
		/**
		 * 	@type { new (environment: slime.jrunscript.git.Installation.argument) => slime.jrunscript.git.Installation }
		 *  @param { slime.jrunscript.git.Installation.argument } environment
		 */
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
							arguments: function(rv) {
								addConfigurationArgumentsTo(rv,m.config);
								rv.push(m.command);
								rv.push.apply(rv, (m.arguments) ? m.arguments : []);
								return rv;
							},
							environment: m.environment,
							directory: m.directory
						})
					);
				};

				/**
				 * @param { { command: string, arguments: (this: string[], p: any) => void, environment?: Function, stdio?: Function, evaluate?: Function } } m
				 * @returns { Function }
				 */
				this.command = function(m) {
					var program = environment.program;
					return function(p) {
						var args = [];
						addConfigurationArgumentsTo(args,p.config);
						args.push(m.command);
						if (typeof(m.arguments) == "function") m.arguments.call(args,p);
						var environment = $api.Object.compose($context.api.shell.environment);
						if (m.environment) {
							var replaced = m.environment.call(environment, p);
							if (typeof(replaced) != "undefined") environment = replaced;
						}
						var stdio;
						if (m.stdio) stdio = m.stdio(p);
						return $context.api.shell.run({
							command: program,
							arguments: args,
							environment: environment,
							stdio: stdio,
							directory: p.directory,
							evaluate: m.evaluate
						});
					}
				}
			};

			var git = cli.old;

			var config = cli.command({
				command: "config",
				arguments: function(p) {
					this.push.apply(this,p.arguments);
				},
				stdio: function() {
					return {
						output: String
					}
				},
				evaluate: function(result) {
					return $api.Object({
						properties: result.stdio.output.split("\n").map(function(line) {
							var token = line.split("=");
							return { name: token[0], value: token[1] }
						})
					});
				}
			});

			//	help

			//	Getting and Creating Projects

			var init = function(m) {
				git({
					command: "init",
					arguments: [m.pathname]
				});
				return new LocalRepository({
					directory: m.pathname.directory
				});
			};

			/**
			 * @param { slime.jrunscript.git.Repository.clone.argument & { repository: string } } p
			 */
			var clone = function(p) {
				if (!p.to) {
					throw new Error("Required: 'to' property indicating destination.");
				}
				git({
					config: p.config,
					command: "clone",
					arguments: [p.repository,p.to.toString()],
					environment: $api.Object.compose($context.api.shell.environment, environment)
				});
				return new LocalRepository({ directory: p.to.directory });
			}

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

			//	Branching and Merging

			//	Sharing and Updating Projects

			var fetch = cli.command({
				command: "fetch",
				arguments: function(p) {
					if (p && p.all) {
						this.push("--all");
						if (p && p.prune) {
							this.push("--prune");
						}
					}
				}
				,
				stdio: function(p) {
					return {
						// output: null,
						// //	TODO	stderr is used to indicate progress when fetching multiple subrepositories; we may want to build
						// //			in the idea of events for commands like this
						// error: null
					}
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
					//	quiet, cached
				},
				stdio: function(p) {
					return {
						output: String
					}
				},
				evaluate: function(result) {
					var linePattern = /(?:\s*)(\S+)(?:\s+)(\S+)(?:\s+)\((\S+)\)/;
					return result.stdio.output.split("\n").filter(function(line) {
						return line;
					}).map(function(line) {
						var parsed = linePattern.exec(line);
						if (!parsed) throw new Error("No match: [" + line + "]");
						var commit = parsed[1];
						var path = parsed[2];
						//	parsed[3] is git describe; see https://git-scm.com/docs/git-submodule
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
					this.push(p.repository.reference);
					this.push(p.path);
				},
				evaluate: function(result) {
					return new LocalRepository({ directory: result.directory.getSubdirectory(result.arguments[3]) });
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
			 * @type { new ({}) => slime.jrunscript.git.Repository }
			 */
			var Repository = function(o) {
				//	Getting and Creating Projects
				/** @type { string } */
				this.reference = void(0);

				/** @property { string } reference */

				/**
				 * @param { slime.jrunscript.git.Repository.clone.argument } p
				 */
				this.clone = function(p) {
					return clone($api.Object.compose(p, {
						repository: this.reference
					}));
				}
			};

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
			 * @type { new (o: any) => slime.jrunscript.git.Repository.Local }
			 */
			var LocalRepository = function(o) {
				Repository.call(this,o);

				this.clone = this.clone;

				var directory = (function() {
					if (o.directory) return o.directory;
					if (o.local) return $api.deprecate(function() {
						return o.local;
					})();
				})();

				this.reference = directory.pathname.toString();

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
					log: new function() {
						//	TODO	refactor parse() to refer to fields by name by indexing fields by string

						var fields = ["H", "cn", "s", "ct", "an", "D", "ae", "at", "ce"];

						this.format = fields.map(function(field) {
							return "%" + field;
						}).join("~~");

						/**
						 * @param { string } line
						 * @returns { slime.jrunscript.git.Commit }
						 */
						this.parse = function(line) {
							var tokens = line.split("~~");
							if (typeof(tokens[5]) == "undefined") throw new Error("No tokens[5]: [" + line + "]");
							var refs = (function(string) {
								var rv = {};
								if (string.length == 0) return rv;
								var tokens = string.split(", ");
								tokens.forEach(function(token) {
									var t = token.split(" -> ");
									if (t.length > 1) {
										if (!rv.names) rv.names = [];
										rv.names.push(t[1]);
									} else {
										if (!rv.names) rv.names = [];
										rv.names.push(t[0]);
									}
								});
								return rv;
							})(tokens[5]);
							return {
								names: refs.names,
								commit: {
									hash: tokens[0]
								},
								author: {
									name: tokens[4],
									email: tokens[6],
									date: ($context.api.time) ? new $context.api.time.When({ unix: Number(tokens[7])*1000 }) : Number(tokens[7])*1000
								},
								committer: {
									name: tokens[1],
									email: tokens[8],
									date: ($context.api.time) ? new $context.api.time.When({ unix: Number(tokens[3])*1000 }) : Number(tokens[3])*1000
								},
								subject: tokens[2]
							}
						}
					}
				};

				/** @type { slime.jrunscript.git.Repository.Local.show } */
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

				var command = function(f) {
					return function(p) {
						return f($api.Object.compose(p, { directory: directory }));
					}
				}

				//	Setup and Config

				this.config = command(config);

				//	Getting and Creating Projects

				//	Basic Snapshotting

				this.add = function(p) {
					add($api.Object.compose(p, { directory: directory }));
				};

				/** @type { ( () => void ) & { getUrl: ({ name: string }) => string } }} */
				var myremote = function() {
					throw new Error("Unimplemented: remote");
				};
				myremote.getUrl = command(remote.getUrl);
				this.remote = myremote;

				this.status = function(p) {
					var self = this;

					return execute({
						command: "status",
						arguments: ["--porcelain", "-b"],
						stdio: {
							output: String
						},
						evaluate: function(result) {
							//	TODO	This ignores renamed files; see git help status
							var parser = /(..) (\S+)/;
							var rv = {};
							result.stdio.output.split("\n").forEach(function(line) {
								if (line.substring(0,2) == "##") {
									var branchName = line.substring(3);
									if (branchName.indexOf("...") != -1) {
										branchName = branchName.substring(0,branchName.indexOf("..."));
									}
									rv.branch = { name: branchName };
									$context.api.js.Object.set(rv, self.show({ object: branchName }));
								} else {
									var match = parser.exec(line);
									if (match) {
										if (!rv.paths) rv.paths = {};
										rv.paths[match[2]] = match[1];
									} else if (line == "") {
										//	do nothing
									} else {
										throw new Error("Unexpected line: [" + line + "]");
									}
								}
							});
							return rv;
						}
					});
				};

				this.commit = function(p) {
					execute({
						command: "commit",
						arguments: (function() {
							if (!p.message) {
								throw new TypeError("Required: message property containing commit message");
							}
							var rv = ["-m", p.message];
							if (p.author) {
								rv.push("--author=" + p.author);
							}
							if (p.all) {
								rv.push("-a");
							}
							return rv;
						})()
					});
				};

				//	Branching and Merging

				this.branch = function(p) {
					var args = [];
					if (!p) p = {};
					if (p.remote) {
						args.push("-r");
					}
					if (p.all) {
						args.push("-a");
					}
					if (p.name) args.push(p.name);
					if (p.start) args.push(p.start);
					if (p.force) {
						args.push("--force");
					}
					if (p.delete) {
						args.push("--delete");
						if (typeof(p.delete) == "string") {
							args.push(p.delete);
						}
					}
					var output = !Boolean(p.name);
					return execute({
						command: "branch",
						arguments: args,
						stdio: {
							output: (output) ? String : (function() {})()
						},
						evaluate: function(result) {
							// var currentBranch;
							// var DELIMITER = "|";
							// if (output) {
							// 	currentBranch = execute({
							// 		command: "rev-parse",
							// 		arguments: [
							// 			"--abbrev-ref", "HEAD"
							// 		],
							// 		stdio: {
							// 			output: String
							// 		},
							// 		evaluate: function(result) {
							// 			//	TODO	would this work on Windows with a two-character line terminator?
							// 			return result.stdio.output.substring(0,result.stdio.output.length-1);
							// 		}
							// 	});
							// 	args.push("--format",["%(refname)"].join(DELIMITER));
							// }
							if (output) {
								var rv = result.stdio.output.split("\n")
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
								// rv.forEach(function(entry) {
								// 	jsh.shell.console(JSON.stringify(show(entry)));
								// })
								if (p.old && !p.all) {
									rv = rv.filter(function(branch) {
										return branch.current;
									})[0];
								}
								return rv;
							} else {
								return (function(){})();
							}
						}
					});
				};

				this.checkout = function(p) {
					var args = [];
					args.push(p.branch);
					execute($context.api.js.Object.set({
						command: "checkout",
						arguments: args
					}, (p.stdio) ? { stdio: p.stdio } : {}));
				};

				/** @type { slime.jrunscript.git.Repository.Local.merge } */
				this.merge = function(p) {
					var args = [];
					args.push(p.name);
					if (p.ff_only) {
						args.push("--ff-only");
					}
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

				this.fetch = command(fetch);

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

				this.submodule = function(p) {
					if (!p) p = {};
					if (!p.command) {
						return command(submodule)(p).map(function(line) {
							//	commit, path
							var subdirectory = directory.getSubdirectory(line.path);
							if (!subdirectory) throw new Error("directory=" + directory + " path=" + line.path);
							var sub = new LocalRepository({ directory: subdirectory });
							return {
								path: line.path,
								repository: sub,
								commit: sub.show(line.commit)
							}
						});
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
				};
				this.submodule.add = command(submodule_add);

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

				this.log = function(p) {
					return execute({
						command: "log",
						arguments: (function() {
							var rv = [];
							rv.push("--format=format:" + formats.log.format);
							if (p && p.since && p.until) {
								rv.push(p.since+".."+p.until);
								rv.push("--");
							} else if (p && p.since || p && p.until) {
								throw new TypeError("Unsupported: since or until without other");
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
							output: String
						}
						,evaluate: function(result) {
							if (result.status != 0) {
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

			/** @property {any} init */
			this.init = init;

			//	Server Admin

			/**
			 * @param { { port: number, basePath: string, exportAll: boolean  } } p
			 * @returns { { kill: () => void } }
			 */
			this.daemon = function(p) {
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
					this.kill = function() {
						process.kill();
					}
				}
			}

			this.Repository = function(p) {
				if (p.local || p.directory) {
					return new LocalRepository(p);
				} else if (p.remote) {
					return new RemoteRepository(p);
				} else {
					throw new TypeError("Required: .local or .remote property.");
				}
			};

			this.execute = function(m) {
				git(m);
			}
		};

		/**
		 * 	@type { (environment: slime.jrunscript.git.Installation.argument) => slime.jrunscript.git.Installation }
		 *  @param { slime.jrunscript.git.Installation.argument } p
		 */
		$exports.Installation = function(p) {
			return new Installation(p);
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

		var GUI = $context.api.Error.Type("Please execute the graphical installer.");

		$exports.install = $context.api.Events.Function(function(p,events) {
			var console = function(message) {
				events.fire("console", message);
			};
			if (!$exports.installation) {
				if ($context.api.shell.os.name == "Mac OS X") {
					console("Detected OS X " + $context.api.shell.os.version);
					console("Install Apple's command line developer tools.");
					$context.api.shell.run({
						command: "/usr/bin/git",
						evaluate: function(result) {
							//	Do nothing; exit status will be 1
							throw new GUI();
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
		});
		$exports.install.GUI = GUI;
	}
//@ts-ignore
)($context,$exports)
