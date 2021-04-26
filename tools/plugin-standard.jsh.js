//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { (value: slime.jsh.wf.Exports["cli"]["initialize"]) => void } $export
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

				var fetch = $api.Function.memoized(function() {
					var repository = jsh.tools.git.Repository({ directory: $context.base });
					jsh.shell.console("Fetching all updates ...");
					repository.fetch({
						all: true,
						prune: true,
						recurseSubmodules: true
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

				/**
				 *
				 * @param { slime.jrunscript.git.Repository.Local } repository
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
						//	TODO	looks like the below is duplicative, checking vs origin/master twice; maybe there's an offline
						//			scenario where that makes sense?
						var repository = jsh.tools.git.Repository({ directory: $context.base });
						var allowDivergeFromMaster = false;
						var vsLocalOriginMaster = jsh.wf.git.compareTo("origin/master")(repository);
						if (vsLocalOriginMaster.behind && vsLocalOriginMaster.behind.length && !allowDivergeFromMaster) {
							throw new Failure("Behind origin/master by " + vsLocalOriginMaster.behind.length + " commits.");
						}
						repository = fetch();
						var vsOriginMaster = jsh.wf.git.compareTo("origin/master")(repository);
						//	var status = repository.status();
						//	maybe check branch above if we allow non-master-based workflow
						//	Perhaps allow a command-line argument or something for this, need to think through branching
						//	strategy overall
						if (vsLocalOriginMaster.behind && vsOriginMaster.behind.length && !allowDivergeFromMaster) {
							throw new Failure("Behind origin/master by " + vsOriginMaster.behind.length + " commits.");
						}
						jsh.wf.requireGitIdentity({ repository: repository }, {
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						});
						//	TODO	emits events; could use those rather than try-catch
						jsh.wf.prohibitUntrackedFiles({ repository: repository });
						if (operations.lint) {
							if (!operations.lint()) {
								throw new Failure("Linting failed.");
							}
						}
						jsh.wf.prohibitModifiedSubmodules({ repository: repository });
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
							refspec: "master"
						});
					}
				}

				if ($context.base.getFile(".eslintrc.json")) {
					jsh.shell.tools.node.require();
					jsh.shell.tools.node.modules.require({ name: "eslint" });
					$exports.eslint = function() {
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.shell.jsh.src.getFile("contributor/eslint.jsh.js"),
							arguments: ["-project", $context.base]
						});
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

				$exports.status = function(p) {
					//	TODO	add option for offline
					var repository = fetch();
					var remote = "origin";
					var branch = "master";
					var vsOriginMaster = jsh.wf.git.compareTo(remote + "/" + branch)(repository);
					var status = repository.status();
					jsh.shell.console("Current branch: " + status.branch.name);
					if (vsOriginMaster.ahead.length) jsh.shell.console("ahead of " + remote + "/" + branch + ": " + vsOriginMaster.ahead.length);
					if (vsOriginMaster.behind.length) jsh.shell.console("behind " + remote + "/" + branch + ": " + vsOriginMaster.behind.length);
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
					if (vsOriginMaster.behind.length && !vsOriginMaster.ahead.length && !vsOriginMaster.paths) {
						jsh.shell.console("Fast-forwarding ...");
						repository.merge({ ffOnly: true, name: remote + "/" + branch });
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
						submodules.forEach(function(item) {
							var remote = "origin";
							if (item.branch && item.status.branch.name != item.branch) {
								jsh.shell.console(item.path + ": tracking branch " + item.branch + ", but checked out branch is " + item.status.branch.name);
							}
							if (item.state.behind.length) {
								jsh.shell.console(item.path + ": behind remote tracked branch " + remote + "/" + item.branch + " (" + item.state.behind.length + " commits)");
							}
							if (item.status.paths) {
								jsh.shell.console(item.path + ": locally modified");
							}
						});
					}
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
					return function(p) {
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.shell.jsh.src.getFile("tools/documentation.jsh.js"),
							//	TODO	make functional implementation of below simpler
							arguments: (function() {
								var rv = [];
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
				}

				$exports.documentation = serveDocumentation({ watch: false });
				$exports.document = serveDocumentation({ watch: true });
			}
		)
	}
//@ts-ignore
)($api, $context.jsh, $export);
