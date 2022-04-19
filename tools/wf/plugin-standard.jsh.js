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
			function($context,operations,$exports) {
				if (arguments.length == 2) {
					//	old signature
					$api.deprecate(function(invocation) {
						$context = invocation[0];
						$exports = invocation[1];
						operations = {};
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

				var Failure = jsh.wf.error.Failure;

				if (operations.test && !operations.commit) {
					operations.commit = function(p) {
						var repository = fetch();

						jsh.wf.requireGitIdentity({ repository: repository }, {
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						});

						jsh.wf.prohibitUntrackedFiles({ repository: repository });

						jsh.wf.prohibitModifiedSubmodules({ repository: repository });

						var remote = "origin";
						var status = repository.status();
						if (status.branch.name === null) {
							throw new Failure("Cannot commit a detached HEAD.");
						}
						var branch = status.branch.name;
						var tracked = remote + "/" + branch;
						if (!branchExists(repository.directory.toString(), tracked)) {
							tracked = "origin/master";
						}

						//	TODO	looks like the below is duplicative, checking vs origin/master twice; maybe there's an offline
						//			scenario where that makes sense?
						var allowDivergeFromOrigin = false;
						var vsLocalOrigin = jsh.wf.git.compareTo(tracked)(repository);
						if (vsLocalOrigin.behind && vsLocalOrigin.behind.length && !allowDivergeFromOrigin) {
							throw new Failure("Behind " + tracked + " by " + vsLocalOrigin.behind.length + " commits.");
						}
						var vsOrigin = jsh.wf.git.compareTo(tracked)(repository);
						//	var status = repository.status();
						//	maybe check branch above if we allow non-master-based workflow
						//	Perhaps allow a command-line argument or something for this, need to think through branching
						//	strategy overall
						if (vsLocalOrigin.behind && vsOrigin.behind.length && !allowDivergeFromOrigin) {
							throw new Failure("Behind " + tracked + " by " + vsOrigin.behind.length + " commits.");
						}

						if (operations.lint) {
							if (!operations.lint()) {
								throw new Failure("Linting failed.");
							}
						}

						jsh.wf.typescript.tsc();

						if (!p.notest) {
							var success = operations.test();
							if (!success) {
								throw new Failure("Tests failed.");
							} else {
								jsh.shell.console("Tests passed; proceeding with commit.");
							}
						} else {
							jsh.shell.console("Skipping tests because 'notest' is true.");
						}

						repository.commit({
							all: true,
							message: p.message
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
				}

				if ($context.base.getFile(".eslintrc.json")) {
					jsh.shell.tools.node.require();
					jsh.shell.tools.node["modules"].require({ name: "eslint" });
					$exports.eslint = function() {
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.shell.jsh.src.getFile("contributor/eslint.jsh.js"),
							arguments: ["-project", $context.base]
						});
					}
				}

				if (operations.lint) {
					$exports.lint = function(p) {
						if (!operations.lint()) {
							jsh.shell.console("Linting failed.");
							return 1;
						} else {
							jsh.shell.console("Linting passed.");
						}
					}
				}

				$exports.tsc = function() {
					try {
						jsh.wf.typescript.tsc();
						jsh.shell.console("Passed.");
					} catch (e) {
						jsh.shell.console("tsc failed.");
						jsh.shell.exit(1);
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

				if (operations.test) {
					$exports.test = function(p) {
						var success = operations.test();
						jsh.shell.console("Tests: " + ( (success) ? "passed." : "FAILED!") );
					}
				}

				$exports.submodule = {
					update: void(0),
					remove: void(0),
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
						jsh.wf.cli.$f.option.string({ longname: "path" }),
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

				$exports.submodule.remove = $api.Function.pipe(
					$api.Function.impure.revise(jsh.wf.cli.$f.option.string({ longname: "path" })),
					function(p) {
						var path = p.options.path;
						jsh.wf.project.submodule.remove({ path: path });
					}
				)

				if (operations.commit) $exports.submodule.update = $api.Function.pipe(
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
						operations.commit({
							message: "Update " + p.options.path + " submodule"
						});
					}
				);

				if (operations.commit) $exports.commit = $api.Function.pipe(
					jsh.wf.cli.$f.option.string({ longname: "message" }),
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
						try {
							operations.commit({ message: p.options.message, notest: p.options.notest });
							jsh.shell.console("Committed changes to " + $context.base);
						} catch (e) {
							//	TODO	should generalize this in the wf.jsh.js script, perhaps even adding an error handler
							//			to jsh.script.cli.wrap or Descriptor or something
							if (e instanceof jsh.wf.error.Failure) {
								jsh.shell.console("ERROR: " + e.message);
							} else {
								jsh.shell.console(e);
								jsh.shell.console(e.stack);
							}
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
