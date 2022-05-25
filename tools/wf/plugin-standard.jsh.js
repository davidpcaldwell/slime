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
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.loader.Export<slime.jsh.wf.Exports["project"]["initialize"]> } $export
	 */
	function($api,jsh,$export) {
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

				var credentialHelper = jsh.shell.jsh.src.getFile("rhino/tools/github/git-credential-github-tokens-directory.bash").toString();
				var fetch = $api.Function.memoized(function() {
					var repository = jsh.tools.git.Repository({ directory: $context.base });
					jsh.shell.console("Fetching all updates ...");
					repository.fetch({
						all: true,
						prune: true,
						recurseSubmodules: true,
						credentialHelpers: [
							"cache",
							credentialHelper
						]
					}, {
						remote: function(e) {
							var remote = e.detail;
							var url = repository.remote.getUrl({ name: remote });
							jsh.shell.console("Fetching updates from: " + url);
						},
						submodule: (function() {
							var first = true;
							return function(e) {
								if (first) {
									jsh.shell.stdio.error.write("Submodules: ");
									first = false;
								}
								if (e.detail) {
									jsh.shell.stdio.error.write(".");
								} else {
									jsh.shell.console("");
								}
							}
						})(),
						stdout_other: function(e) {
							if (e.detail) jsh.shell.console("STDOUT: " + e.detail);
						},
						stderr_other: function(e) {
							if (e.detail) jsh.shell.console("STDERR: " + e.detail);
						}
					});
					jsh.shell.console("");
					jsh.shell.console("Fetched updates.");
					jsh.shell.console("");
					return repository;
				});

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
					var allBranches = jsh.tools.git.program({ command: "git" }).repository(repository).command(getBranches).argument().run()
						.map(function(branch) {
							if (branch.name.substring(0,"remote/".length) == "remote/") return branch.name.substring("remote/".length);
							return branch.name;
						});
					return Boolean(allBranches.find(function(branch) { return branch == base; }));
				}

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

				if ( (project.lint || project.test) && !project.precommit ) {
					project.precommit = jsh.wf.checks.precommit({
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
						refspec: "HEAD",
						config: {
							"credential.helper": credentialHelper
						}
					});
				}

				if ($context.base.getFile(".eslintrc.json")) {
					$exports.eslint = function() {
						var result = jsh.wf.project.lint.eslint();
						return (result) ? 0 : 1;
					}
				}

				if (project.lint) {
					$exports.lint = Object.assign(
						function(p) {
							var result = project.lint.check({
								console: function(e) {
									jsh.shell.console(e.detail);
								}
							})
							if (!result) {
								jsh.shell.console("Linting failed.");
								return 1;
							} else {
								jsh.shell.console("Linting passed.");
							}
						},
						{
							fix: function(p) {
								project.lint.fix({
									console: function(e) {
										jsh.shell.console(e.detail);
									}
								})
							}
						}
					);
				}

				$exports.tsc = function() {
					var result = jsh.wf.checks.tsc()({
						console: function(e) {
							jsh.shell.console(e.detail);
						}
					});
					if (result) {
						jsh.shell.console("Passed.");
					} else {
						jsh.shell.console("tsc failed.");
						return 1;
					}
				};

				$exports.typedoc = function() {
					jsh.wf.typescript.typedoc();
				}

				var displayBranchName = function(name) {
					return (name === null) ? "(detached HEAD)" : name;
				}

				var submoduleStatus = function(prefix) {
					/**
					 *
					 * @param { slime.jsh.wf.Submodule } item
					 */
					var rv = function(item) {
						var remote = "origin";
						if (item.branch && item.status.branch.name != item.branch) {
							jsh.shell.console(prefix + item.path + ": tracking branch " + item.branch + ", but checked out branch is " + item.status.branch.name);
						}
						if (!item.state) {
							jsh.shell.console(prefix + item.path + ": no remote tracking branch");
						} else if (item.state.behind.length) {
							jsh.shell.console(prefix + item.path + ": behind remote tracked branch " + remote + "/" + item.branch + " (" + item.state.behind.length + " commits)");
						}
						if (item.status.paths) {
							jsh.shell.console(prefix + item.path + ": locally modified");
						}
						if (item.repository.submodule().length) {
							item.repository.submodule().map(jsh.wf.project.Submodule.construct).forEach(function(submodule) {
								submoduleStatus(prefix + item.path + "/")(submodule);
							})
						}
					}
					return rv;
				}

				$exports.status = function(p) {
					//	TODO	add option for offline
					var repository = fetch();
					var remote = "origin";
					var status = repository.status();
					var branch = status.branch.name;
					var base = remote + "/" + branch;
					if (!branchExists(repository.directory.toString(), base)) {
						base = "origin/master";
					}
					var vsRemote = (branch) ? jsh.wf.git.compareTo(base)(repository) : null;
					jsh.shell.console("Current branch: " + displayBranchName(status.branch.name));
					if (vsRemote && vsRemote.ahead.length) jsh.shell.console("ahead of " + base + ": " + vsRemote.ahead.length);
					if (vsRemote && vsRemote.behind.length) jsh.shell.console("behind " + base + ": " + vsRemote.behind.length);
					var output = $api.Function.result(
						status.paths,
						$api.Function.conditional({
							condition: Boolean,
							true: $api.Function.pipe(
								$api.Function.Object.entries,
								$api.Function.Array.map(function(entry) {
									return entry[1] + " " + entry[0];
								}),
								$api.Function.Array.join("\n")
							),
							false: $api.Function.returning(null)
						})
					);
					if (output) jsh.shell.console(output);
					if (vsRemote && vsRemote.behind.length && !vsRemote.ahead.length && !vsRemote.paths) {
						jsh.shell.console("Fast-forwarding ...");
						repository.merge({ ffOnly: true, name: base });
					}
					var branches = repository.branch({ remote: true, all: true });
					var first = true;
					branches.forEach(function findUnmergedBranches(branch) {
						if (branch.name === null) {
							return;
						} else {
							var compared = jsh.wf.git.compareTo(branch.name)(repository);
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
					if (repository.submodule().length) {
						jsh.shell.console("");
						jsh.shell.console("Submodules:");
						var submodules = jsh.wf.project.submodule.status();
						submodules.forEach(submoduleStatus(""));
					}
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

					var repository = jsh.tools.git.program({ command: "git" }).repository($context.base.pathname.toString());

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
						var success = project.test({
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

				if (project.precommit) {
					$exports.precommit = function(p) {
						var success = project.precommit({
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						});
						jsh.shell.console("Checks: " + ( (success) ? "passed." : "FAILED!") );
						return (success) ? 0 : 1;
					}
				}

				$exports.submodule = {
					update: (project.precommit) ? $api.Function.pipe(
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
							jsh.wf.project.updateSubmodule({ path: p.options.path });
							var result = project.precommit({
								console: function(e) {
									jsh.shell.console(e.detail);
								}
							});
							if (result) {
								commit(jsh.tools.git.Repository({ directory: $context.base }), "Update " + p.options.path + " submodule");
							}
						}
					) : void(0),
					remove: $api.Function.pipe(
						$api.Function.impure.revise(jsh.script.cli.option.string({ longname: "path" })),
						function(p) {
							var path = p.options.path;
							jsh.wf.project.submodule.remove({ path: path });
						}
					),
					attach: $api.Function.pipe(
						jsh.script.cli.option.string({ longname: "path" }),
						function(p) {
							var repository = jsh.tools.git.Repository({ directory: $context.base });
							var submodule = repository.submodule({ cached: true }).find(function(submodule) {
								return submodule.path == p.options.path;
							});
							if (!submodule) {
								jsh.shell.console("ERROR: " + repository + " does not have a (direct) submodule at " + p.options.path);
								return 1;
							}
							var tracking = submodule.branch;
							var branch = submodule.repository.status().branch.name;
							if (branch === null && tracking) {
								submodule.repository.branch({
									name: tracking,
									startPoint: "HEAD",
									force: true
								});
								submodule.repository.checkout({ branch: tracking });
							} else {
								jsh.shell.console("Submodule " + p.options.path + " of " + repository + " must be detached HEAD with tracking branch.");
								return 1;
							}
						}
					),
					reset: $api.Function.pipe(
						jsh.script.cli.option.string({ longname: "path" }),
						function(p) {
							var repository = jsh.tools.git.Repository({ directory: $context.base });
							var submodule = repository.submodule({ cached: true }).find(function(submodule) {
								return submodule.path == p.options.path;
							});
							var revision = submodule.commit.commit.hash;
							//	TODO	implement git reset API
							submodule.repository.execute({
								command: "reset",
								arguments: [
									"--hard",
									revision
								]
							})
							if (submodule.branch) {
								submodule.repository.checkout({ branch: revision });
								submodule.repository.branch({
									force: true,
									name: submodule.branch
								});
								submodule.repository.checkout({ branch: submodule.branch });
							}
						}
					)
				};

				if (project.precommit) $exports.commit = $api.Function.pipe(
					jsh.script.cli.option.string({ longname: "message" }),
					jsh.script.cli.option.boolean({ longname: "notest" }),
					function(p) {
						//	Leave redundant check for message for now, in case there are existing implementations of
						//	operations.commit that do not check. But going forward they should check themselves.
						var repository = jsh.tools.git.Repository({ directory: $context.base });
						var status = repository.status();
						var defaultCommitMessage = null;
						if (status.paths) {
							var modified = $api.Function.result(
								status.paths,
								$api.Function.Object.entries
							);
							if (
								modified.length &&
								modified.every(function(entry) {
									return isSubmodulePath(repository,entry[0])
								})
							) {
								defaultCommitMessage = "Update "
									+ ( (modified.length > 1) ? "submodules" : "submodule" )
									+ " " + modified.map(function(entry) { return entry[0]; }).join(", ");
							}
						}
						if (!p.options.message && defaultCommitMessage) {
							p.options.message = defaultCommitMessage;
						}

						if (!p.options.message) throw new Error("No default commit message, and no message given.");

						//	TODO	removed a notest option that could be used here
						var check = project.precommit({
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						});
						if (check) {
							commit(jsh.tools.git.Repository({ directory: $context.base }), p.options.message);
							jsh.shell.console("Committed changes to " + $context.base);
						} else {
							jsh.shell.console("Precommit checks failed; aborting commit.");
							return 1;
						}
					}
				);

				var serveDocumentation = function(c) {
					return $api.Function.pipe(
						function(p) {
							jsh.shell.run({
								command: jsh.shell.jsh.src.getFile("fifty"),
								//	TODO	make functional implementation of below simpler
								arguments: (function() {
									var rv = [];

									rv.push("view");

									rv.push("--base", $context.base);

									var host = (function(provided) {
										if (provided) return provided;
										return $context.base.pathname.basename;
									})(p.options.host);
									rv.push("--host", host);

									if (c.watch) rv.push("--watch");

									return rv;
								})()
							});
						}
					)
				}

				$exports.documentation = serveDocumentation({ watch: false });

				$exports.document = serveDocumentation({ watch: true });
			}
		)
	}
//@ts-ignore
)($api, $context.jsh, $export);
