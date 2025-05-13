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
	 * @param { slime.jsh.wf.standard.Context } $context
	 * @param { slime.loader.Export<slime.jsh.wf.standard.Export> } $export
	 */
	function($api,$context,$export) {
		var library = $context.library;
		var jsh = $context.jsh;
		var api = $context.api;

		/**
		 *
		 * @param { slime.jrunscript.tools.git.repository.Local } repository
		 * @param { string } path
		 */
		var isSubmodulePath = function(repository,path) {
			var submodules = repository.submodule();
			return submodules.some(function(submodule) {
				return submodule.path == path;
			});
		}

		/**
		 * @param { slime.jrunscript.file.Directory } project
		 */
		function getDefaultCommitMessage(project) {
			var repository = library.git.oo.Repository({ directory: project });
			var status = repository.status();
			if (status.paths) {
				var modified = $api.fp.result(
					status.paths,
					Object.entries
				);
				if (
					modified.length &&
					modified.every(function(entry) {
						return isSubmodulePath(repository,entry[0])
					})
				) {
					return "Update "
						+ ( (modified.length > 1) ? "submodules" : "submodule" )
						+ " " + modified.map(function(entry) { return entry[0]; }).join(", ");
				}
			}
			return null;
		}

		$export(
			function($context,project,$exports) {
				if (arguments.length == 2) {
					//	old signature
					$api.deprecate(function(invocation) {
						$context = invocation[0];
						$exports = invocation[1];
						project = {};
					})(arguments);
				}

				//	TODO	the below credentialHelper code also appears to be in tools/wf/plugin.jsh.js

				//	TODO	is this stuff documented anywhere?
				var credentialHelper = jsh.shell.jsh.src.getFile("rhino/tools/git/git-credential-tokens-directory.bash").toString();

				/** @type { slime.jrunscript.tools.git.Command<void,{ current: boolean, name: string }[]> } */
				var getBranches = {
					invocation: function() {
						return {
							command: "branch",
							arguments: $api.Array.build(function(rv) {
								rv.push("-a");
							})
						}
					},
					result: function(output) {
						var lines = output.split("\n");
						return lines.map(function(line) {
							return {
								current: line.substring(0,1) == "*",
								name: line.substring(2)
							}
						})
					}
				}

				/**
				 *
				 * @param { string } repository
				 * @param { string } base
				 * @returns
				 */
				var branchExists = function(repository,base) {
					var allBranches = library.git.program({ command: "git" }).repository(repository).command(getBranches).argument().run()
						.map(function(branch) {
							if (branch.name.substring(0,"remote/".length) == "remote/") return branch.name.substring("remote/".length);
							if (branch.name.substring(0,"remotes/".length) == "remotes/") return branch.name.substring("remotes/".length);
							return branch.name;
						});
					return Boolean(allBranches.find(function(branch) { return branch == base; }));
				}

				if ( (project.lint || project.test) && !project.precommit ) {
					project.precommit = api.checks().precommit({
						lint: (project.lint) ? project.lint.check : void(0),
						test: project.test
					})
				}

				/**
				 *
				 * @param { slime.jrunscript.tools.git.repository.Local } repository
				 * @param { string } message
				 */
				var commit = function(repository,message) {
					var target = library.git.program({ command: "git" }).repository(repository.directory.toString());

					var status = target.command(library.git.commands.status).argument().run();

					if (status.branch === null) {
						throw new Error("Cannot commit on detached HEAD.");
					}

					repository.commit({
						all: true,
						noVerify: true,
						message: message
					});

					//	We checked for upstream changes, so now we're going to push
					//	If we allow branching, we may or may not really want to push, or may not want to push to
					//	master
					repository.push({
						repository: "origin",
						refspec: status.branch,
						config: {
							"credential.helper": credentialHelper
						}
					});
				}

				if ($context.base.getFile(".eslintrc.json")) {
					$exports.eslint = function() {
						var result = api.project().lint.eslint();
						return (result) ? 0 : 1;
					}
				}

				if (project.lint) {
					$exports.lint = Object.assign(
						function(p) {
							var result = $api.fp.world.now.ask(
								project.lint.check,
								{
									console: function(e) {
										jsh.shell.console(e.detail);
									}
								}
							);
							if (!result) {
								jsh.shell.console("Linting failed.");
								return 1;
							} else {
								jsh.shell.console("Linting passed.");
							}
						},
						{
							fix: function(p) {
								$api.fp.world.now.tell(
									project.lint.fix,
									{
										console: function(e) {
											jsh.shell.console(e.detail);
										}
									}
								);
							}
						}
					);
				}

				$exports.tsc = $api.fp.pipe(
					jsh.script.cli.option.boolean({ longname: "vscode" }),
					function(p) {
						/**
						 * Reformats output so that is is clickable in the VSCode terminal. See also
						 * [VSCode issue](https://github.com/microsoft/vscode/issues/160895) describing the need for this.
						 *
						 * @type { (message: string) => string }
						 */
						function formatForVscode(message) {
							var pattern = /^(.*)\((\d+),(\d+)\)\: (.*)/;
							var match = pattern.exec(message);
							if (match) {
								return match[1] + ":" + match[2] + ":" + match[3] + ": " + match[4];
							} else {
								return message;
							}
						}
						var formatter = (p.options.vscode) ? formatForVscode : $api.fp.identity;
						var result = $api.fp.world.now.question(
							api.checks().tsc,
							void(0),
							{
								console: function(e) {
									jsh.shell.console(e.detail);
								},
								output: function(e) {
									jsh.shell.console(formatter(e.detail));
								}
							}
						);
						if (result) {
							jsh.shell.console("Passed.");
						} else {
							jsh.shell.console("tsc failed.");
							return 1;
						}
					}
				);

				$exports.typedoc = function() {
					api.typescript().typedoc.now();
				}

				var displayBranchName = function(name) {
					return (name === null) ? "(detached HEAD)" : name;
				}

				/**
				 *
				 * @param { string } [prefix] Used internally; external callers should omit it.
				 * @returns An array of messages
				 */
				var submoduleStatus = function(prefix) {
					if (!prefix) prefix = "";
					/**
					 *
					 * @param { slime.jsh.wf.Submodule } item
					 */
					return function(item) {
						var remote = "origin";
						var rv = [];
						if (item.branch && item.status.branch.name != item.branch) {
							rv.push(prefix + item.path + ": tracking branch " + item.branch + ", but checked out branch is " + item.status.branch.name);
						}
						if (!item.state) {
							rv.push(prefix + item.path + ": no remote tracking branch");
						} else if (item.state.behind.length) {
							rv.push(prefix + item.path + ": behind remote tracked branch " + remote + "/" + item.branch + " (" + item.state.behind.length + " commits)");
						}
						if (item.status.paths) {
							rv.push(prefix + item.path + ": locally modified");
						}
						if (item.repository.submodule().length) {
							item.repository.submodule().map(api.project().Submodule.construct).forEach(function(submodule) {
								var messages = submoduleStatus(prefix + item.path + "/")(submodule);
								rv.push.apply(rv, messages);
							});
						}
						return rv;
					}
				}

				$exports.status = function(p) {
					/** @type { slime.jrunscript.tools.git.Command<void,{ stash: string }[]> } */
					var stashList = {
						invocation: function() {
							return {
								command: "stash",
								arguments: ["list"]
							}
						},
						result: $api.fp.pipe(
							$api.fp.string.split("\n"),
							$api.fp.Array.map($api.fp.RegExp.exec(/^([^\:]+)(?:.*)$/)),
							$api.fp.Array.filter($api.fp.Maybe.present),
							$api.fp.Array.map($api.fp.property("value")),
							$api.fp.Array.map(function(p) {
								return { stash: p[1] };
							})
						)
					};

					//	TODO	add option for offline
					var oRepository = api.git().fetch();
					var fRepository = library.git.program({ command: "git" }).repository(oRepository.directory.toString());
					var remote = "origin";
					var status = fRepository.command(library.git.commands.status).argument().run();
					var branch = status.branch;
					var base = remote + "/" + branch;
					if (!branchExists(oRepository.directory.toString(), base)) {
						var origin = fRepository.command(library.git.commands.remote.show).argument("origin").run();
						var trunk = origin.head;
						base = "origin/" + trunk;
					}
					var vsRemote = (branch) ? api.git().compareTo(base)(oRepository) : null;
					jsh.shell.console("Current branch: " + displayBranchName(status.branch));
					if (vsRemote && vsRemote.ahead.length) jsh.shell.console("ahead of " + base + ": " + vsRemote.ahead.length);
					if (vsRemote && vsRemote.behind.length) jsh.shell.console("behind " + base + ": " + vsRemote.behind.length);
					var output = $api.fp.result(
						status.entries,
						$api.fp.conditional({
							condition: function(entries) {
								return entries.length > 0;
							},
							true: $api.fp.pipe(
								$api.fp.Array.map(function(entry) {
									if (entry.orig_path) {
										return entry.code + " " + entry.path + " (was: " + entry.orig_path + ")";
									} else {
										return entry.code + " " + entry.path;
									}
								}),
								$api.fp.Array.join("\n")
							),
							false: $api.fp.returning(null)
						})
					);
					if (output) jsh.shell.console(output);

					var stashes = fRepository.command(stashList).argument().run();
					if (stashes.length) {
						jsh.shell.console("");
						jsh.shell.console("Stashes:");
						stashes.forEach(function(stash) {
							jsh.shell.console(stash.stash);
						});
					}

					if (vsRemote && vsRemote.behind.length && !vsRemote.ahead.length && !vsRemote.paths) {
						jsh.shell.console("");
						jsh.shell.console("Fast-forwarding ...");
						oRepository.merge({ ffOnly: true, name: base });
					}
					var branches = oRepository.branch({ remote: true, all: true });
					var first = true;
					branches.forEach(function findUnmergedBranches(branch) {
						if (branch.name === null) {
							return;
						} else {
							var compared = api.git().compareTo(branch.name)(oRepository);
							if (compared.behind.length) {
								if (first) {
									jsh.shell.console("");
									first = false;
								}
								jsh.shell.console("Unmerged branch: " + branch.name);
							}
						}
					});
					if (!first) {
						jsh.shell.console("");
					}
					if (oRepository.submodule().length) {
						jsh.shell.console("");
						jsh.shell.console("Submodules:");
						var submodules = api.project().submodule.status();
						var messages = submodules.reduce(function(rv,submodule) {
							return rv.concat(submoduleStatus()(submodule))
						}, []);
						messages.forEach(jsh.shell.console);
						if (messages.length == 0) {
							jsh.shell.console("All submodules up to date.");
						}
					}
					jsh.shell.console("");
					jsh.shell.console("Finished.");
				}

				$exports.prune = function(p) {
					/** @type { slime.jrunscript.tools.git.Command<string,{ head: string }> } */
					var showNamedRemote = {
						invocation: function(remote) {
							return {
								command: "remote",
								arguments: ["show", remote]
							}
						},
						result: function(output) {
							var rv = {
								head: void(0)
							};
							//	TODO	yuck
							var headBranchPrefix = "  HEAD branch: ";
							output.split("\n").forEach(function(line) {
								if (line.substring(0,headBranchPrefix.length) == headBranchPrefix) {
									rv.head = line.substring(headBranchPrefix.length);
								}
							});
							return rv;
						}
					};

					/** @type { slime.jrunscript.tools.git.Command<string,{ name: string, remote?: string }[]> } */
					var getAllBranchesMergedTo = {
						invocation: function(name) {
							return {
								command: "branch",
								arguments: ["-a", "--merged", name]
							};
						},
						result: function(output) {
							return output.split("\n").map(function(line) {
								return line.substring(2);
							}).filter(function(line) {
								return line && line.substring(0,"remotes/origin/HEAD".length) != "remotes/origin/HEAD";
							}).map(function(line) {
								if (line.substring(0,"remotes/".length) == "remotes/") {
									var descriptor = line.substring("remotes/".length);
									var tokens = descriptor.split("/");
									return {
										remote: tokens[0],
										name: tokens.slice(1).join("/")
									};
								} else {
									return { name: line }
								}
							});
						}
					};

					/** @type { slime.jrunscript.tools.git.Command<{ name: string, remote?: string },void> } */
					var deleteRemoteBranch = {
						invocation: function(p) {
							return {
								command: "push",
								arguments: ["-d", p.remote, p.name]
							}
						},
						result: function(output) {
						}
					};

					/** @type { slime.jrunscript.tools.git.Command<string,void> } */
					var deleteLocalBranch = {
						invocation: function(name) {
							return {
								command: "branch",
								arguments: ["-d", name]
							}
						},
						result: function(output) {
						}
					};

					var repository = library.git.program({ command: "git" }).repository($context.base.pathname.toString());

					var main = repository.command(
						showNamedRemote
					).argument(
						"origin"
					).run().head;

					var merged = repository.command(getAllBranchesMergedTo).argument(main).run().filter(function(branch) {
						return branch.name != main;
					});
					merged.forEach(function(branch) {
						if (branch.remote) {
							jsh.shell.console("Deleting " + branch.name + " at " + branch.remote + " ...");
							repository.command(deleteRemoteBranch).argument(branch).run();
						} else {
							jsh.shell.console("Deleting " + branch.name + " ...");
							repository.command(deleteLocalBranch).argument(branch.name).run();
						}
					});
				}

				if (project.test) {
					$exports.test = function(p) {
						var success = $api.fp.world.now.ask(project.test, {
							output: function(e) {
								jsh.shell.console(e.detail);
							},
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						});
						jsh.shell.console("Tests: " + ( (success) ? "passed." : "FAILED!") );
						return (success) ? 0 : 1;
					}
				}

				$exports.git = {
					hooks: {}
				};

				/** @type { slime.jrunscript.tools.git.Command<void,void> } */
				var unstage = {
					invocation: function(p) {
						return {
							command: "reset",
							arguments: []
						}
					}
				};

				$exports.git.hooks["post-checkout"] = function() {
					var repository = library.git.program({ command: "git" }).repository($context.base.pathname.toString());
					var origin = repository.command(library.git.commands.remote.show).argument("origin").run();
					var trunk = origin.head;
					var status = repository.command(library.git.commands.status).argument().run();
					if (status.branch == trunk) {
						repository.command(library.git.commands.fetch).argument().run();
						repository.command(library.git.commands.merge).argument({ name: "origin/" + trunk }).run();
						//	TODO	below is implemented in top-level wf.js, and is used in git.branches.prune
						// cleanGitBranches()();
					}
					if ($context.base.getFile(".gitmodules")) {
						repository.command(library.git.commands.submodule.update).argument().run();
					}
				}

				if (project.precommit) {
					$exports.precommit = function() {
						var repository = library.git.program({ command: "git" }).repository($context.base.pathname.toString());
						var success = project.precommit({
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						});
						jsh.shell.console("Checks: " + ( (success) ? "passed." : "FAILED!") );
						if (!success) {
							repository.command(unstage).argument().run();
						}
						return (success) ? 0 : 1;
					};

					$exports.git.hooks["pre-commit"] = function() {
						return $exports.precommit({
							options: {},
							arguments: []
						});
					}

					$exports.git.hooks["prepare-commit-msg"] = function(p) {
						var messageFile = p.arguments[0];
						var messageSource = p.arguments[1];
						var commitObjectName = p.arguments[2];
						// jsh.shell.console(JSON.stringify({
						// 	messageFile: messageFile,
						// 	messageSource: messageSource,
						// 	commitObjectName: commitObjectName
						// }, void(0), 4));
						// jsh.shell.console("Contents:");
						// jsh.shell.console(
						// 	jsh.file.Pathname(messageFile).file.read(String)
						// )
						// jsh.shell.console("===");
						var defaultMessage = getDefaultCommitMessage($context.base);
						if (defaultMessage) {
							var location = library.file.Pathname(messageFile);
							var now = location.file.read(String);
							var after = defaultMessage + "\n" + now;
							location.write(after, { append: false });
						}
					}
				}

				$exports.git.hooks["post-merge"] = function() {
					var repository = library.git.program({ command: "git" }).repository($context.base.pathname.toString());
					if ($context.base.getFile(".gitmodules")) {
						repository.command(library.git.commands.submodule.update).argument().run();
					}

					/** @type { slime.jrunscript.tools.git.Command<void,void> } */
					var push = {
						invocation: function() {
							return {
								command: "push",
								arguments: ["origin", "HEAD"]
							}
						}
					};

					repository.command(push).argument().run();
				}

				$exports.git.hooks["post-commit"] = function() {
					var repository = library.git.oo.Repository({ directory: $context.base });

					//	We checked for upstream changes, so now we're going to push
					//	If we allow branching, we may or may not really want to push, or may not want to push to
					//	master
					repository.push({
						repository: "origin",
						refspec: "HEAD",
						config: {
							"credential.helper": credentialHelper
						}
					});
				}

				$exports.submodule = {
					update: (project.precommit) ? $api.fp.pipe(
						/**
						 *
						 * @param { slime.jsh.script.cli.Invocation<slime.jsh.wf.standard.Options & { path: string }> } p
						 */
						function(p) {
							var rv = {
								options: $api.Object.compose(p.options),
								arguments: []
							};
							for (var i=0; i<p.arguments.length; i++) {
								if (p.arguments[i] == "--path") {
									rv.options.path = p.arguments[++i];
								} else {
									rv.arguments.push(p.arguments[i]);
								}
							}
							return rv;
						},
						function(p) {
							api.project().updateSubmodule({ path: p.options.path });
							var result = project.precommit({
								console: function(e) {
									jsh.shell.console(e.detail);
								}
							});
							if (result) {
								commit(library.git.oo.Repository({ directory: $context.base }), "Update " + p.options.path + " submodule");
							}
						}
					) : void(0),
					remove: $api.fp.pipe(
						jsh.script.cli.option.string({ longname: "path" }),
						function(p) {
							var path = p.options.path;
							api.project().submodule.remove({ path: path });
						}
					),
					attach: $api.fp.pipe(
						jsh.script.cli.option.string({ longname: "path" }),
						jsh.script.cli.option.boolean({ longname: "recursive" }),
						function(p) {
							api.project().submodule.attach({ path: p.options.path, recursive: p.options.recursive });
						}
					),
					reset: $api.fp.pipe(
						jsh.script.cli.option.string({ longname: "path" }),
						function(p) {
							var repository = library.git.oo.Repository({ directory: $context.base });
							jsh.shell.console("repository = " + $context.base);
							var submodules = repository.submodule({ cached: true });
							jsh.shell.console(
								JSON.stringify(
									submodules.map(function(submodule) {
										return {
											path: submodule.path
										}
									})
								)
							);
							jsh.shell.console("--path = [" + p.options.path + "]");
							var submodule = submodules.find(function(submodule) {
								return submodule.path == p.options.path;
							});
							var revision = submodule.commit.commit.hash;
							submodule.repository.execute({
								command: "reset",
								arguments: [
									"--hard",
									revision
								]
							})
							if (submodule.branch) {
								//	TODO	seems like this could be a standard command
								/** @type { slime.jrunscript.tools.git.Command<{ branch: string },void> } */
								var checkout = {
									invocation: function(p) {
										return {
											command: "checkout",
											arguments: [p.branch]
										}
									}
								}
								var withoutHooks = library.git.program({ command: "git" }).config({
									//	TODO	UNIX-like operating systems only
									"core.hooksPath": "/dev/null"
								}).repository(submodule.repository.directory.toString())
								//	TODO	need to use version of git checkout that disables commit hooks
								withoutHooks.command(checkout).argument({ branch: revision }).run();
								submodule.repository.branch({
									force: true,
									name: submodule.branch
								});
								withoutHooks.command(checkout).argument({ branch: submodule.branch }).run();
							}
						}
					)
				};

				if (project.precommit) $exports.commit = $api.fp.pipe(
					jsh.script.cli.option.string({ longname: "message" }),
					jsh.script.cli.option.boolean({ longname: "notest" }),
					function(p) {
						var repository = library.git.program({ command: "git" }).repository($context.base.pathname.toString());

						var status = repository.command(library.git.commands.status).argument().run();

						if (status.entries.length == 0) {
							jsh.shell.console("Cannot commit; no modified files.");
							return 1;
						}

						var defaultCommitMessage = getDefaultCommitMessage($context.base);

						if (!p.options.message && defaultCommitMessage) {
							p.options.message = defaultCommitMessage;
						}

						//	Leave redundant check for message for now, in case there are existing implementations of
						//	operations.commit that do not check. But going forward they should check themselves.
						if (!p.options.message) throw new Error("No default commit message, and no message given.");

						//	TODO	removed a notest option that could be used here
						var check = project.precommit({
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						});
						if (check) {
							commit(library.git.oo.Repository({ directory: $context.base }), p.options.message);
							jsh.shell.console("Committed changes to " + $context.base);
						} else {
							jsh.shell.console("Precommit checks failed; aborting commit.");
							return 1;
						}
					}
				);

				/** @type { (c: { watch: boolean }) => slime.jsh.script.cli.Command<slime.jsh.wf.standard.Options> } */
				var serveDocumentation = function(c) {
					return $api.fp.pipe(
						jsh.script.cli.option.string({ longname: "host" }),
						function(p) {
							var run = $api.fp.now(
								jsh.shell.subprocess.question,
								$api.fp.world.Sensor.mapping()
							);

							var result = run({
								command: "bash",
								arguments: $api.Array.build(function(rv) {
									rv.push(jsh.shell.jsh.src.getFile("fifty").pathname.toString());

									rv.push("view");

									rv.push("--base", $context.base.pathname.toString());

									var host = (function(provided) {
										if (provided) return provided;
										return $context.base.pathname.basename;
									})(p.options.host);

									rv.push("--host", host);

									if (c.watch) rv.push("--watch");
								})
							});

							return result.status;
						}
					)
				}

				$exports.documentation = serveDocumentation({ watch: false });

				$exports.document = serveDocumentation({ watch: true });
			}
		)
	}
//@ts-ignore
)($api, $context, $export);
