//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($api,$slime,jsh,$loader,plugin) {
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
					prohibitModifiedSubmodules: void(0),
					cli: void(0)
				};

				var base = (function() {
					if (jsh.shell.environment.PROJECT) return jsh.file.Pathname(jsh.shell.environment.PROJECT).directory;
					return jsh.shell.PWD;
				})();

				jsh.wf.project = {
					base: base,
					submodule: {
						status: function() {
							var repository = jsh.tools.git.Repository({ directory: base });
							var submodules = repository.submodule();
							return submodules.map(function(submodule) {
								var tracking = submodule.branch;
								return $api.Object.compose(
									submodule,
									{
										status: submodule.repository.status(),
										state: (tracking) ? jsh.wf.git.compareTo("origin/" + tracking)(submodule.repository) : void(0)
									}
								)
							});
						},
						remove: function(p) {
							var repository = jsh.tools.git.Repository({ directory: base });
							jsh.shell.console("Removing submodule " + p.path);
							var checkout = base.getSubdirectory(p.path);
							if (checkout && checkout.getSubdirectory(".git")) {
								jsh.shell.console("Removing submodule .git ...");
								checkout.getSubdirectory(".git").remove();
							}
							var isConfigured = repository.config({ arguments: ["--list"] })["submodule." + p.path + ".url"];
							if (isConfigured) {
								jsh.shell.console("De-init ...");
								repository.submodule.deinit({ path: p.path, force: true });
							}
							if (checkout) {
								jsh.shell.console("git rm ...");
								repository.rm({ path: p.path });
							}

							var gitdir = (function(target) {
								if (target.getFile(".git")) throw new TypeError("Not supported for submodules of submodules; " + target.getFile(".git") + " is file.");
								if (target.getFile(".git")) {
									var reference = jsh.shell.console(target.getFile(".git").read(String));
									//	string like gitdir: ../../.git/modules/path/to/me
								}
								return target.getSubdirectory(".git");
							})(repository.directory);
							var module = gitdir.getSubdirectory("modules").getSubdirectory(p.path);
							if (module) {
								jsh.shell.console("Remove modules/" + p.path + " directory ...");
								module.remove();
							} else {
								jsh.shell.console("No modules/ directory for " + p.path + ".");
							}
						}
					},
					updateSubmodule: function(p) {
						var subcheckout = base.getSubdirectory(p.path);
						if (!subcheckout) {
							throw new Error("Submodule not found at " + p.path + " of " + base);
						}
						var repository = jsh.tools.git.Repository({ directory: base.getSubdirectory(p.path) });

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
					},
					/**
					 * @type { slime.jsh.wf.Exports["project"]["initialize"] }
					 */
					initialize: $loader.module("plugin-standard.jsh.js", {
						jsh: jsh
					})
				};

				jsh.wf.cli = {
					error: {
						TargetNotFound: $api.Error.Type({ name: "TargetNotFound" }),
						TargetNotFunction: $api.Error.Type({ name: "TargetNotFunction", extends: TypeError })
					},
					$f: {
						command: {
							parse: function(p) {
								return {
									command: p.arguments[0],
									options: p.options,
									arguments: p.arguments.slice(1)
								}
							},
							target: function(p) {
								var command = (p.target) ? p.target : "";
								var method = (function(command) {
									//jsh.shell.console("command = [" + command + "]");
									var tokens = (command.length) ? command.split(".") : [];
									//jsh.shell.console("tokens = " + JSON.stringify(tokens));
									/** @type { slime.jsh.wf.cli.Interface | slime.jsh.wf.cli.Command } */
									var rv = p.interface;
									for (var i=0; i<tokens.length; i++) {
										if (rv) rv = rv[tokens[i]];
									}
									return rv;
								})(command);

								if (typeof(method) == "function") {
									return method;
								} else if (!method) {
									throw new jsh.wf.cli.error.TargetNotFound("Command not found: [" + command + "]", {
										command: command
									});
								} else {
									throw new jsh.wf.cli.error.TargetNotFunction("Implementation is not a function: [" + command + "]" + ", but " + method, {
										command: command,
										target: method
									});
								}
							},
							process: function(p) {
								try {
									var method = this.target({
										target: p.invocation.command,
										interface: p.interface
									});
									method.call(
										null,
										{
											options: p.invocation.options,
											arguments: p.invocation.arguments
										}
									);
								} catch (e) {
									if (e instanceof jsh.wf.cli.error.TargetNotFound) {
										jsh.shell.console(String(e));
										jsh.shell.exit(1);
									} else if (e instanceof jsh.wf.cli.error.TargetNotFunction) {
										jsh.shell.console(String(e));
										jsh.shell.exit(1);
									} else {
										jsh.shell.console(e);
										jsh.shell.console(e.stack);
										throw e;
									}
								}
							},
							execute: function(p) {
								var invocation = jsh.wf.cli.$f.command.parse(p.arguments);
								jsh.wf.cli.$f.command.process({ interface: p.interface, invocation: invocation });
							}
						},
						option: {
							/**
							 * @param { Parameters<slime.jsh.wf.Exports["cli"]["$f"]["option"]["string"]>[0] } o
							 */
							string: function(o) {
								var rv = function(p) {
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
								return $api.Function.impure.revise(rv);
							},
							/**
							 * @param { Parameters<slime.jsh.wf.Exports["cli"]["$f"]["option"]["boolean"]>[0] } o
							 */
							boolean: function(o) {
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
								return $api.Function.impure.revise(rv);
							},
							number: function(o) {
								var rv = function(p) {
									var args = [];
									for (var i=0; i<p.arguments.length; i++) {
										if (o.longname && p.arguments[i] == "--" + o.longname) {
											p.options[o.longname] = Number(p.arguments[++i]);
										} else {
											args.push(p.arguments[i]);
										}
									}
									p.arguments = args;
								}
								return $api.Function.impure.revise(rv);
							},
							pathname: function(o) {
								var rv = function(p) {
									var args = [];
									for (var i=0; i<p.arguments.length; i++) {
										if (o.longname && p.arguments[i] == "--" + o.longname) {
											p.options[o.longname] = jsh.script.getopts.parser.Pathname(p.arguments[++i]);
										} else {
											args.push(p.arguments[i]);
										}
									}
									p.arguments = args;
								}
								return $api.Function.impure.revise(rv);
							}
						},
						invocation: function(f) {
							return $api.Function.result(
								{
									options: {},
									arguments: Array.prototype.slice.call(jsh.script.arguments)
								},
								f
							);
						}
					},
					invocation: function() {
						/** @type { slime.jsh.script.Invocation<any> } */
						var rv = {
							options: {},
							arguments: Array.prototype.slice.call(jsh.script.arguments)
						};
						/** @type { slime.jsh.wf.cli.Processor[] } */
						var mutators = Array.prototype.slice.call(arguments);
						mutators.forEach(function(mutator) {
							mutator(rv);
						})
						return rv;
					},
					/**
					 * @type { slime.jsh.wf.Exports["cli"]["initialize"] }
					 */
					initialize: $api.deprecate(jsh.wf.project.initialize)
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

				jsh.wf.typescript = (function() {
					function getVersion(project) {
						if (project.getFile("tsc.version")) return project.getFile("tsc.version").read(String);
						return "4.0.5";
					}

					function getConfig(base) {
						if (base.getFile("tsconfig.json")) return base.getFile("tsconfig.json");
						if (base.getFile("jsconfig.json")) return base.getFile("jsconfig.json");
						throw new Error("No TypeScript configuration file found at " + base);
					}

					return {
						require: function(p) {
							var project = (p && p.project) ? p.project : base;
							jsh.shell.tools.node.require();
							jsh.shell.tools.node.modules.require({ name: "typescript", version: getVersion(project) });
						},
						tsc: function(p) {
							var project = (p && p.project) ? p.project : base;
							var result = jsh.shell.jsh({
								script: jsh.shell.jsh.src.getFile("tools/tsc.jsh.js"),
								arguments: [
									"-version", getVersion(project),
									"-tsconfig", getConfig(project)
								]
							});
							if (result.status) throw new Error("tsc failed.");
						},
						typedoc: function(p) {
							var project = (p && p.project) ? p.project : base;
							jsh.shell.jsh({
								shell: jsh.shell.jsh.src,
								script: jsh.shell.jsh.src.getFile("tools/typedoc.jsh.js"),
								arguments: [
									"--ts:version", getVersion(project),
									"--tsconfig", getConfig(project),
									"--output", project.getRelativePath("local/doc/typedoc"),
								]
							});
						}
					}
				})();

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
							throw new Error(
								"Submodule " + sub.path + " " + submodule + " "
								+ "is modified in " + p.repository
								+ " paths=" + JSON.stringify(status.paths)
							);
						}
					});
				});
			}
		})
	}
//@ts-ignore
)($api,$slime,jsh,$loader,plugin)