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
(
	/**
	 * @param { slime.jrunscript.git.Context } $context
	 * @param { slime.jrunscript.git.Exports } $exports
	 */
	function($context,$exports) {

		/** @type { new (environment: slime.jrunscript.git.Installation.argument) => slime.jrunscript.git.Installation } */
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

				this.command = function(m) {
					var program = environment.program;
					function rv(p,events) {
						var args = [];
						addConfigurationArgumentsTo(args,p.config);
						if (p.credentialHelper) {
							args.push("-c", "credential.helper=", "-c", "credential.helper=" + p.credentialHelper);
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
								result.argument = p;
								return m.evaluate(result);
							} : m.evaluate
						}, {
							terminate: function(e) {
								//	way to dispatch
								events.fire("terminate", e.detail);
							}
						});
					}
					return $api.Events.Function(rv);
				};

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

			/** @type { slime.jrunscript.git.Installation["init"] } */
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

			/** @type { slime.jrunscript.git.Repository["clone"] } */
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
			 * @type { slime.jrunscript.git.Repository.Local["fetch"] }
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
					//	quiet, cached
				},
				stdio: function(p) {
					return {
						output: String
					}
				},
				evaluate: function(result) {
					var linePattern = /(?:\s*)(\S+)(?:\s+)(\S+)((?:\s+)\((\S+)\))?/;
					return result.stdio.output.split("\n").filter(function(line) {
						return line;
					}).map(function(line) {
						var parsed = linePattern.exec(line);
						if (!parsed) throw new Error("No match in submodule evaluate: [" + line + "] in\n" + result.stdio.output);
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
				stdio: cli.stdio.Events(),
				evaluate: function(result) {
					return new LocalRepository({ directory: result.directory.getSubdirectory(result.arguments[3]) });
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
			 * @type { new ({}) => slime.jrunscript.git.Repository }
			 */
			var Repository = function(o) {
				//	Getting and Creating Projects
				/** @type { string } */
				this.reference = void(0);

				/** @property { string } reference */

				this.clone = clone;
			};

			/**
			 * @type { new ({}) => slime.jrunscript.git.Repository }
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
			 * @type { new (o: any) => slime.jrunscript.git.Repository.Local }
			 */
			var LocalRepository = function(o) {
				Repository.call(this,o);

				var directory = (function() {
					if (o.directory) return o.directory;
					if (o.local) return $api.deprecate(function() {
						return o.local;
					})();
				})();

				var command = function(f) {
					return function(p, events) {
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

				/** @type { slime.jrunscript.git.Repository.Local["show"] } */
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

				/** @type { slime.jrunscript.git.Repository.Local["config"] } */
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

				/** @type { slime.jrunscript.git.Repository.Local["status"] } */
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
									rv.branch = {
										name: branchName,
										current: true,
										commit: self.show({ object: branchName })
									};
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

				/** @type { slime.jrunscript.git.Repository.Local["commit"] } */
				this.commit = command(commit);

				//	Branching and Merging

				/**
				 * @param { string } output
				 * @returns { slime.jrunscript.git.Branch[] }
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
				 * @param { { remote?: boolean, all?: boolean } } p
				 * @returns { slime.jrunscript.git.Branch[] }
				 */
				var branchList = function(p) {
					var args = [];
					if (p.remote) {
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
				 * @returns { slime.jrunscript.git.Branch }
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

				/** @type { slime.jrunscript.git.Repository.Local["checkout" ] } */
				this.checkout = function(p) {
					var args = [];
					args.push(p.branch);
					execute($context.api.js.Object.set({
						command: "checkout",
						arguments: args
					}, (p.stdio) ? { stdio: p.stdio } : {}));
				};

				/** @type { slime.jrunscript.git.Repository.Local["merge"] } */
				this.merge = function(p) {
					var args = [];
					if (p.noCommit) {
						args.push("--no-commit");
					}
					if (p.ffOnly) {
						args.push("--ff-only");
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

				/** @type { slime.jrunscript.git.Repository.Local["fetch"] } */
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

				/** @type { slime.jrunscript.git.Repository.Local["submodule"] } */
				this.submodule = Object.assign(function(p) {
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

				/** @type { slime.jrunscript.git.Repository.Local["log"] } */
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
								//	TODO	rename to revisionRange? see https://git-scm.com/docs/git-log
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

			this.init = init;

			//	Server Admin

			/** @type { slime.jrunscript.git.Installation["daemon"] } */
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

			/** @type { slime.jrunscript.git.Installation["Repository"] } */
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

		/** @type { (environment: slime.jrunscript.git.Installation.argument) => slime.jrunscript.git.Installation } */
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
