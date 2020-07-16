//@ts-check
(
	/**
	 * @param { jsh } jsh
	 * @param {jsh.plugin.plugin} plugin
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
					prohibitModifiedSubmodules: void(0)
				};

				var base = (function() {
					if (jsh.shell.environment.PROJECT) return jsh.file.Pathname(jsh.shell.environment.PROJECT).directory;
					return jsh.shell.PWD;
				})();

				jsh.wf.project = {
					base: base,
					updateSubmodule: function(p) {
						/* @returns { slime.jrunscript.git.Repository.Local } */
						var castToLocal = $api.Function.identity;

						var repository = castToLocal(jsh.tools.git.Repository({ directory: base.getSubdirectory(p.path) }));

						jsh.shell.console("Update subrepository " + repository + " ...");
						var current = repository.branch().filter(function(branch) {
							return branch.current;
						})[0];
						jsh.shell.console("Subrepository is on branch: " + current.name);
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
							} else {
								jsh.shell.console("Cannot update: merge is required.");
								jsh.shell.exit(1);
							}
						}
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