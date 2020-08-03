//@ts-check
(
	/**
	 * @param { jsh } jsh
	 * @param { jsh.plugin.plugin } plugin
	 */
	function(jsh,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.file && jsh.shell && jsh.ui && jsh.tools && jsh.tools.git);
			},
			load: function() {
				jsh.wf = {
					project: void(0),
					git: void(0),
					typescript: void(0),
					requireGitIdentity: void(0),
					prohibitUntrackedFiles: void(0),
					$f: void(0),
					invocation: void(0),
					prohibitModifiedSubmodules: void(0),
					cli: void(0)
				};

				var base = (function() {
					if (jsh.shell.environment.PROJECT) return jsh.file.Pathname(jsh.shell.environment.PROJECT).directory;
					return jsh.shell.PWD;
				})();

				/* @returns { slime.jrunscript.git.Repository.Local } */
				var castToLocal = $api.Function.identity;

				jsh.wf.project = {
					base: base,
					submodule: {
						status: function() {
							var repository = castToLocal(jsh.tools.git.Repository({ directory: base }));
							var submodules = repository.submodule();
							return submodules.map(function(submodule) {
								var current = submodule.repository.branch().filter(function(branch) {
									return branch.current;
								})[0];
								return {
									path: submodule.path,
									branch: current,
									state: jsh.wf.git.compareTo("origin/master")(submodule.repository)
								}
							});
						}
					},
					updateSubmodule: function(p) {
						var repository = castToLocal(jsh.tools.git.Repository({ directory: base.getSubdirectory(p.path) }));

						jsh.shell.console("Update subrepository " + repository + " ...");
						var current = repository.branch().filter(function(branch) {
							return branch.current;
						})[0];
						jsh.shell.console("Subrepository is on branch: " + current.name);
						if (current.name != "master") {
							jsh.shell.console("Cannot update: not on master, but " + current.name);
							jsh.shell.exit(1);
						}
						repository.fetch({ all: true });
						var comparison = jsh.wf.git.compareTo("origin/master")(repository);
						jsh.shell.console(JSON.stringify(comparison,void(0),4));
						if (comparison.paths) {
							jsh.shell.console(repository + " is modified; aborting.");
							jsh.shell.exit(1);
						}
						if (comparison.behind.length) {
							if (!comparison.ahead.length) {
								repository.merge({ ffOnly: true, name: "origin/master" });
								repository.submodule.update({ recursive: true });
							} else {
								jsh.shell.console("Cannot update: merge is required.");
								jsh.shell.exit(1);
							}
						} else {
							jsh.shell.console(repository + " is up to date.");
						}
					}
				};

				jsh.wf.cli = {
					/**
					 * @type { jsh.wf.Exports["cli"]["initialize"] }
					 */
					initialize: function($context,operations,$exports) {
						if (arguments.length == 2) {
							//	old signature
							$api.deprecate(function(invocation) {
								$context = invocation[0];
								$exports = invocation[1];
								operations = {};
							})(arguments);
						}

						if (operations.test && !operations.commit) {
							operations.commit = function(p) {
								var repository = jsh.tools.git.Repository({ directory: $context.base });
								jsh.wf.requireGitIdentity({ repository: repository }, {
									console: function(e) {
										jsh.shell.console(e.detail);
									}
								});
								jsh.wf.prohibitUntrackedFiles({ repository: repository });
								jsh.wf.prohibitModifiedSubmodules({ repository: repository });
								jsh.wf.typescript.tsc();
								var success = operations.test();
								if (!success) {
									throw new Error("Tests failed.");
								}
								repository.commit({
									all: true,
									message: p.message
								});
							}
						}

						$exports.tsc = function() {
							jsh.wf.typescript.tsc();
						};

						$exports.submodule = {
							update: void(0)
						};

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

						$exports.status = function(p) {
							//	TODO	add option for offline
							var repository = fetch();
							var vsOriginMaster = jsh.wf.git.compareTo("origin/master")(repository);
							var status = repository.status();
							jsh.shell.console("Current branch: " + status.branch.name);
							if (vsOriginMaster.ahead.length) jsh.shell.console("ahead of origin/master: " + vsOriginMaster.ahead.length);
							if (vsOriginMaster.behind.length) jsh.shell.console("behind origin/master: " + vsOriginMaster.behind.length);
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
								repository.merge({ ffOnly: true, name: "origin/master" });
							}
							if (repository.submodule().length) {
								jsh.shell.console("");
								jsh.shell.console("Submodules:");
								var submodules = jsh.wf.project.submodule.status();
								submodules.forEach(function(item) {
									if (item.branch.name != "master") {
										jsh.shell.console(item.path + ": not on master");
									}
									if (item.state.behind.length) {
										jsh.shell.console(item.path + ": behind (" + item.state.behind.length + " commits)");
									}
									if (item.state.paths) {
										jsh.shell.console(item.path + ": locally modified");
									}
								});
							}
						}

						if (operations.commit) $exports.submodule.update = $api.Function.pipe(
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
							function(p) {
								var rv = {
									options: $api.Object.compose(p.options),
									arguments: []
								};
								for (var i=0; i<p.arguments.length; i++) {
									if (p.arguments[i] == "--message") {
										rv.options.message = p.arguments[++i];
									} else {
										rv.arguments.push(p.arguments[i]);
									}
								}
								return rv;
							},
							function(p) {
								if (!p.options.message) throw new Error("No message");
								operations.commit({ message: p.options.message });
							}
						);
					}
				};

				jsh.wf.$f = {
					option: {
						/**
						 * @param { Parameters<jsh.wf.Exports["$f"]["option"]["string"]>[0] } o
						 */
						string: function(o) {
							/**
							 * @param { jsh.wf.Invocation } p
							 */
							var rv = function(p) {
								jsh.shell.console("string " + o.longname + " " + JSON.stringify(p));
								var args = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + o.longname) {
										p.options[o.longname] = p.arguments[++i];
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return rv;
						},
						/**
						 * @param { Parameters<jsh.wf.Exports["$f"]["option"]["boolean"]>[0] } o
						 */
						boolean: function(o) {
							/**
							 * @param { jsh.wf.Invocation } p
							 */
							var rv = function(p) {
								var args = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + o.longname) {
										p.options[o.longname] = true;
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return rv;
						}
					}
				}

				jsh.wf.invocation = function(mutator) {
					var rv = {
						options: {},
						arguments: Array.prototype.slice.call(jsh.script.arguments)
					};
					Array.prototype.slice.call(arguments).forEach(function(mutator) {
						mutator(rv);
					})
					return rv;
				};

				var guiAsk = function(pp) {
					return function(p) {
						//	TODO	this "works" but could be improved in terms of font size and screen placement
						return jsh.ui.askpass.gui({
							prompt: "Enter " + pp.name + " for Git repository " + p.repository.directory.toString(),
							nomask: true
						});
					}
				};

				jsh.wf.git = {
					compareTo: function(branchName) {
						return function(repository) {
							var ahead = repository.log({ revisionRange: branchName + ".." });
							var behind = repository.log({ revisionRange: ".." + branchName });
							var status = repository.status();
							return {
								ahead: ahead,
								behind: behind,
								paths: status.paths
							}
						};
					}
				};

				jsh.wf.typescript = {
					tsc: function(p) {
						var config = (function() {
							if (base.getFile("tsconfig.json")) return base.getFile("tsconfig.json");
							if (base.getFile("jsconfig.json")) return base.getFile("jsconfig.json");
							throw new Error("No TypeScript configuration file found at " + base);
						})()
						jsh.shell.run({
							command: jsh.shell.jsh.src.getFile("tools/tsc.bash"),
							arguments: [
								"-tsconfig", config
							]
						})
					}
				}

				jsh.wf.requireGitIdentity = Object.assign($api.Events.Function(function(p,events) {
					var get = p.get || {
						name: function(p) {
							throw new Error("Missing: user.name");
						},
						email: function(p) {
							throw new Error("Missing: user.email");
						}
					};
					var config = p.repository.config({
						arguments: ["--list"]
					});
					if (!config["user.name"]) {
						events.fire("console", "Getting user.name for " + p.repository);
						p.repository.config({
							arguments: ["user.name", get.name({ repository: p.repository })]
						});
					} else {
						events.fire("console", "Found user.name " + config["user.name"] + " for " + p.repository);
					}
					if (!config["user.email"]) {
						events.fire("console", "Getting user.email for " + p.repository);
						p.repository.config({
							arguments: ["user.email", get.email({ repository: p.repository })]
						});
					} else {
						events.fire("console", "Found user.email " + config["user.email"] + " for " + p.repository);
					}
				}), {
					get: {
						gui: {
							name: guiAsk({ name: "user.name" }),
							email: guiAsk({ name: "user.email" })
						}
					}
				});

				jsh.wf.prohibitUntrackedFiles = $api.Events.Function(function(p, events) {
					var status = p.repository.status();
					var untracked = (status.paths) ? $api.Object.properties(status.paths).filter(function(property) {
						return property.value == "??"
					}).map(function(property) { return property.name; }) : [];
					if (untracked.length) {
						events.fire("untracked", untracked);
					}
				}, {
					untracked: function(e) {
						throw new Error("Found untracked files: " + e.detail.join("\n"));
					}
				});

				jsh.wf.prohibitModifiedSubmodules = $api.Events.Function(function(p,events) {
					p.repository.submodule().forEach(function(sub) {
						var submodule = jsh.tools.git.Repository({ directory: p.repository.directory.getSubdirectory(sub.path) });
						var status = submodule.status();
						if (status.paths) {
							throw new Error("Submodule " + sub.path + " is modified.");
						}
					});
				});
			}
		})
	}
//@ts-ignore
)(jsh,plugin)