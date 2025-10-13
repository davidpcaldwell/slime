//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.wf.cli.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.project.wf.Interface } $exports
	 */
	function(Packages,$api,jsh,$context,$loader,$exports) {
		var $$api = {
			Function: {
				switch: function() {
					var patterns = arguments;
					return function() {
						for (var i=0; i<patterns.length; i++) {
							if (patterns[i].case.apply(this,arguments)) return patterns[i].use.apply(this,arguments);
						}
					}
				}
			}
		}

		function synchronizeEclipseSettings() {
			//	copy project settings to Eclipse project if they differ from current settings
			var changed = false;
			$context.base.getRelativePath(".settings").createDirectory({
				exists: function(dir) {
					return false;
				}
			});

			["org.eclipse.jdt.core.prefs","org.eclipse.buildship.core.prefs"].forEach(function(filename) {
				var destination = $context.base.getSubdirectory(".settings").getRelativePath(filename);
				var now = (destination.file) ? destination.file.read(String) : void(0);
				var after = $context.base.getFile("contributor/" + filename).read(String);
				if (now != after) {
					$context.base.getFile("contributor/" + filename).copy(
						$context.base.getSubdirectory(".settings").getRelativePath(filename),
						{
							filter: function() {
								return true;
							}
						}
					);
					changed = true;
				}
			});
			if (changed) jsh.shell.console("VSCode: Execute the 'Java: Clean Java Language Server Workspace' command to update Java settings.");
		}

		var git = {
			repository: jsh.tools.git.program({ command: "git" }).repository($context.base.toString()),
			command: {
				/** @type { slime.jrunscript.tools.git.Command<void,void> } */
				fetch: {
					invocation: function() {
						return { command: "fetch" }
					}
				},
				/** @type { slime.jrunscript.tools.git.Command<{ branch: string },void> } */
				checkout: {
					invocation: function(p) {
						return {
							command: "checkout",
							arguments: $api.Array.build(function(rv) {
								rv.push("-m");
								rv.push(p.branch);
							})
						}
					}
				},
				/** @type { slime.jrunscript.tools.git.Command<{ name: string, startPoint: string, track?: "direct" | "inherit" | "no" },void> } */
				createBranch: {
					invocation: function(p) {
						return {
							command: "branch",
							arguments: $api.Array.build(function(rv) {
								if (p.track === "no") {
									rv.push("--no-track");
								}
								rv.push(p.name);
								if (p.startPoint) rv.push(p.startPoint);
							})
						}
					}
				}
			}
		};

		var getTrunk = function() {
			return git.repository.command(jsh.tools.git.commands.remote.show).argument("origin").run().head;
		};

		var repository = (jsh.tools.git.oo.Repository) ? jsh.tools.git.oo.Repository({ directory: $context.base }) : void(0);

		/**
		 *
		 * @param { slime.jrunscript.tools.git.Branch } branch
		 */
		var notMaster = function(branch) {
			var trunk = getTrunk();
			return branch.name != ("remotes/origin/" + trunk) && branch.name != trunk;
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.git.Branch } target
		 * @returns { (p: slime.jrunscript.tools.git.Branch) => boolean }
		 */
		var notBranch = function(target) {
			return function(branch) {
				return branch.name != target.name;
			}
		}

		/** @type { slime.$api.fp.world.Means<void,void> } */
		var cleanGitBranches = function() {
			return function(events) {
				repository.fetch({ all: true, prune: true, recurseSubmodules: true, stdio: { output: null } });
				/** @type { slime.jrunscript.tools.git.Branch[] } */
				var branches = repository.branch({ all: true });
				var target = "remotes/origin/" + getTrunk();
				var checkedOut = repository.status().branch;
				branches.filter(notMaster).filter(notBranch(checkedOut)).forEach(function(branch) {
					var common = repository.mergeBase({ commits: [target, branch.commit.commit.hash] });
					if (common.commit.hash == branch.commit.commit.hash) {
						if (/^remotes\//.test(branch.name)) {
							var parsed = branch.name.split("/");
							jsh.shell.console("Merged; removing remotely: " + branch.name);
							var argument = {
								delete: true,
								repository: parsed[1],
								refspec: parsed.slice(2).join("/")
							};
							repository.push(argument);
						} else {
							jsh.shell.console("Merged to " + target + "; removing " + branch.name);
							repository.branch({ delete: branch.name });
						}
					} else {
						jsh.shell.console("Unmerged: " + branch.name);
					}
				});
			}
		};

		var generateTypedocIncludes = function() {
			/** @type { slime.project.dependencies.Script } */
			var code = $loader.script("contributor/dependencies/module.js");
			var api = code({
				java: {
					version: String(Packages.java.lang.System.getProperty("java.version"))
				},
				library: {
					file: jsh.file
				}
			});
			var to = $api.fp.now( $context.base.pathname.os.adapt(), jsh.file.Location.directory.relativePath("local/typedoc/dependencies.md") );
			api.typedoc.generate(
				to
			);
			jsh.shell.console("Wrote new dependencies TypeDoc includes to " + to.pathname);
		};

		$exports.initialize = $api.fp.pipe(
			function initialize(p) {
				jsh.wf.project.git.installHooks();
				//	TODO	could consider whether we can wire our commit process into the git hooks mechanism:
				//			git config core.hooksPath contributor/hooks
				//			... and then appropriately implement contributor/hooks/pre-commit

				//	Provided for testing, allows an automated test to initialize without GUI prompting for git identity
				//	Currently used by plugin-standard.jsh.fifty.ts to install TypeScript types so tsc passes in parent project
				var skipGitIdentityRequirement =
					(p && p.arguments[0] == "--test-skip-git-identity-requirement")
					|| jsh.shell.environment.SLIME_WF_SKIP_GIT_IDENTITY_REQUIREMENT
				;

				if (!skipGitIdentityRequirement) {
					var gitIdentityProvider = (p && p.arguments[0] == "--test-git-identity-requirement") ? void(0) : jsh.wf.inputs.gitIdentityProvider.gui;

					var gitIdentityProvided = jsh.wf.checks.requireGitIdentity({
						repository: jsh.tools.git.oo.Repository({ directory: $context.base }),
						get: gitIdentityProvider
					})({
						console: function(e) {
							jsh.shell.console(e.detail);
						},
						debug: function(e) {
							//	do nothing for now
						}
					});

					if (!gitIdentityProvided) {
						//	TODO	returning 1 here apparently does not function as expected. Perhaps wf still has a disjoint
						//			implementation from jsh.script.cli?
						jsh.shell.console("user.name and user.email must be set on the local repository.");
						jsh.shell.console("From the source directory " + $context.base + ":");
						jsh.shell.console("git config user.name \"Your Name\"");
						jsh.shell.console("git config user.email \"youremail@yourdomain.com\"");
						//	TODO	test whether returning 1 works. It might not, the special initialize hook might need to be
						//			modified
						jsh.shell.exit(1);
					}
				}

				(
					function node() {
						var installation = jsh.shell.tools.node.installation;

						(
							function core() {
								var getVersion = $api.fp.world.Sensor.old.mapping({
									sensor: jsh.shell.tools.node.Installation.getVersion
								});

								$api.fp.world.now.tell(jsh.shell.tools.node.require.action, {
									found: function(e) {
									},
									removed: function(e) {
										jsh.shell.console("Removed Node.js " + e.detail.version);
									},
									installed: function(e) {
										jsh.shell.console("Installed Node.js " + getVersion(e.detail));
									}
								});
							}
						)();
						(
							function eslint() {
								var nodeProject = { base: $context.base.pathname.toString() };

								var modules = jsh.shell.tools.node.Project.modules(nodeProject)(installation);

								$api.fp.world.Action.now({
									action: modules.require({ name: "eslint", version: "9.13.0" }),
									handlers: {
										installing: function(e) {
											jsh.shell.console("Installing eslint " + e.detail.version);
										},
										installed: function(e) {
											jsh.shell.console("Installed eslint " + e.detail.version);
										}
									}
								});

								$api.fp.world.Action.now({
									action: modules.require({ name: "@eslint/js" }),
									handlers: {
										installed: function(e) {
											jsh.shell.console("Installed @eslint/js " + e.detail.version);
										}
									}
								});

								// $api.fp.world.now.action(
								// 	jsh.shell.tools.node.Installation.modules.require({ name: "@eslint/js" }),
								// 	installation,
								// 	{
								// 		installed: function(e) {
								// 			jsh.shell.console("Installed eslint " + e.detail.version);
								// 		}
								// 	}
								// )
							}
						)();
						(
							function jsyaml() {
								$api.fp.world.Action.now({
									action: jsh.shell.tools.node.Installation.modules(installation).require({ name: "@types/js-yaml" }),
									handlers: {
										installed: function(e) {
											jsh.shell.console("Installed @types/js-yaml " + e.detail.version);
										}
									}
								})
							}
						)();
						(
							function github() {
								$api.fp.world.Action.now({
									action: jsh.shell.tools.node.Installation.modules(installation).require({ name: "@octokit/types" }),
									handlers: {
										installed: function(e) {
											jsh.shell.console("Installed @octokit/types " + e.detail.version);
										}
									}
								})
							}
						)();
					}
				)();

				var isEclipseProject = Boolean($context.base.getSubdirectory("bin"));
				if (isEclipseProject) {
					synchronizeEclipseSettings();
				}

				//	Required for old loader/document implementation
				if (false) (
					function jsoup() {
						jsh.shell.tools.jsoup.require();
					}
				)();

				(function wiki() {
					if (!jsh.tools.git.installation) return;
					var remote = jsh.tools.git.oo.Repository({ remote: "https://github.com/davidpcaldwell/slime.wiki.git" });
					var location = $context.base.getRelativePath("local/wiki");
					if (!location.directory) {
						remote.clone({ to: location });
					}
				})();

				//	TODO	below is messy; think it just removes ./bin?
				$api.fp.impure.now.process(
					$api.fp.impure.Input.supply(
						function() { return $context.base.pathname.os.adapt(); }
					)(
						$api.fp.pipe(
							jsh.file.Location.directory.relativePath("bin"),
							function(bin) {
								var exists = $api.fp.world.now.question(jsh.file.Location.directory.exists.world(), bin);
								if (exists) {
									$api.fp.world.now.action(
										jsh.file.Location.directory.remove.world(),
										bin
									);
								}
							}
						)
					)
				);

				generateTypedocIncludes();
			}
		);

		$exports.vscode = {
			java: {
				refresh: function() {
					function removeIfPresent(path) {
						var location = $context.base.getRelativePath(path);
						if (location.file) {
							location.file.remove();
						} else if (location.directory) {
							location.directory.remove();
						}
					}

					removeIfPresent(".settings");
					removeIfPresent(".project");
					removeIfPresent(".classpath");
					removeIfPresent("bin");

					jsh.shell.console("To complete the process of re-generating the VSCode project:");
					jsh.shell.console("VSCode: Execute the 'Java: Clean Java Language Server Workspace' command.");
					jsh.shell.console("When prompted, choose Reload and delete.");
					jsh.shell.console("If prompted to import Java projects in the workspace, choose Yes.");
					jsh.shell.console("After the import is complete, run the wf initialize command and follow its instructions.");
				}
			}
		}

		/** @type { slime.jsh.wf.Lint["check"] } */
		var lint = function(events) {
			if (!events.fire) throw new Error();
			var success = true;

			success = success && $api.fp.world.now.ask(
				jsh.wf.checks.lint().check,
				{
					console: function(e) {
						events.fire("console", e.detail);
					}
				}
			);

			events.fire("console", "Verifying MPL license headers ...");
			var license = $api.fp.world.Sensor.old.mapping({ sensor: jsh.shell.subprocess.question })({
				command: "bash",
				arguments: $api.Array.build(function(rv) {
					rv.push(jsh.shell.jsh.src.getRelativePath("jsh").toString());
					rv.push(jsh.shell.jsh.src.getRelativePath("contributor/code/license.jsh.js").toString());
				})
			});

			if (license.status) {
				events.fire("console", "License headers need to be updated; run:");
				events.fire("console", "./jsh contributor/code/license.jsh.js --fix");
				success = false;
			} else {
				events.fire("console", "All license headers are correct.")
			}

			return success;
		};

		/**
		 * Runs the test suite, first installing Java, and Rhino.
		 *
		 * If the `docker` property is specified, the Selenium driver is installed and the docker flag is passed through to the
		 * test suite to specify running the tests configured for the Docker environment.
		 *
		 * Exits the VM with exit status 1 on failure; otherwise, returns `true`.
		 *
		 * @param { { docker?: boolean } } [p]
		 * @returns { slime.jsh.wf.Test }
		 */
		var test = function(p) {
			if (!p) p = {};
			return function(events) {
				//	This invocation will install the JDK if necessary, and then ensure the version of Rhino is the correct one for
				//	that JDK
				jsh.shell.run({
					command: "bash",
					arguments: [
						$context.base.getRelativePath("jsh"),
						$context.base.getRelativePath("jrunscript/jsh/tools/install/rhino.jsh.js"),
						"--replace"
					]
				});

				//	Inserted to try to deal with issue #896. May not be needed; TypeScript may be installed when needed anyway. But with
				//	tsc blipping in and out of existence, it seemed prudent to try simplifying the TypeScript life cycle.
				jsh.wf.typescript.require();

				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					{
						command: "bash",
						arguments: $api.Array.build(function(rv) {
							rv.push(jsh.shell.jsh.src.getFile("jsh").toString());
							rv.push($context.base.getRelativePath("contributor/suite.jsh.js"));
							if (p.docker) rv.push("-docker");
							if (jsh.shell.environment.JSH_TEST_ISSUE317) rv.push("-issue317");
						})
					},
					{
						stdout: function(e) {
							events.fire("output", e.detail.line);
						},
						stderr: function(e) {
							events.fire("console", e.detail.line);
						}
					}
				)
				if (result.status != 0) {
					jsh.shell.console("Failing because tests failed.");
				}
				return result.status == 0;
			}
		};

		var project = (
			/**
			 *
			 * @returns { slime.jsh.wf.standard.Project }
			 */
			function() {
				/** @type { slime.jsh.wf.Precommit } */
				var precommit = $api.fp.world.old.ask(function(events) {
					var success = true;

					var trunk = getTrunk();
					var repository = jsh.tools.git.oo.Repository({ directory: $context.base });
					var branch = repository.status().branch.name;
					if (branch == trunk) {
						events.fire("console", "Cannot commit directly to " + trunk);
						success = false;
					}

					success = success && jsh.wf.checks.precommit({
						lint: lint
					})({
						console: function(e) {
							events.fire("console", e.detail);
						}
					});

					return success;
				});

				return {
					lint: {
						check: lint,
						fix: jsh.wf.checks.lint().fix
					},
					test: test({ docker: false }),
					precommit: precommit
				}
			}
		)();

		jsh.wf.project.initialize(
			$context,
			project,
			$exports
		);

		$exports.check = $api.fp.pipe(
			jsh.script.cli.option.boolean({ longname: "docker" }),
			function(p) {
				jsh.shell.console("Linting ...");
				var lintingPassed = $api.fp.world.now.ask(lint, {
					console: function(e) {
						jsh.shell.console(e.detail);
					}
				});
				if (!lintingPassed) {
					jsh.shell.console("Linting failed.");
					return 1;
				}
				jsh.shell.console("Running TypeScript compiler ...");
				jsh.wf.checks.tsc();
				jsh.shell.console("Running tests ...");
				var testsPassed = $api.fp.world.now.ask(
					test({
						docker: p.options.docker
					}),
					{
						console: function(e) {
							jsh.shell.console(e.detail);
						},
						output: function(e) {
							jsh.shell.echo(e.detail);
						}
					}
				);
				if (!testsPassed) {
					jsh.shell.console("Tests failed.");
					return 1;
				}
				jsh.shell.console("Passed.");
			}
		);

		if (jsh.tools.git.oo.Repository) {
			(
				function() {
					$exports.git.branch = $api.fp.pipe(
						function(p) {
							var name = p.arguments[0];
							git.repository.command(git.command.fetch).argument().run();
							git.repository.command(git.command.createBranch).argument({ name: name, startPoint: "origin/" + getTrunk(), track: "no" }).run();
							git.repository.command(git.command.checkout).argument({ branch: name }).run();
						}
					);

					$exports.git.trunk = $api.fp.pipe(
						function(p) {
							git.repository.command(git.command.checkout).argument({ branch: getTrunk() }).run();
							$api.fp.world.now.action(cleanGitBranches);
						}
					)

					$exports.git.branches = (jsh.tools.git.oo.Repository) ? {
						list: $api.fp.pipe(
							function(p) {
								repository.fetch({ all: true, prune: true, recurseSubmodules: true, stdio: { output: null } });
								/** @type { slime.jrunscript.tools.git.Branch[] } */
								var branches = repository.branch({ all: true });
								var target = "remotes/origin/" + getTrunk();
								branches.filter(notMaster).forEach(function(branch) {
									var common = repository.mergeBase({ commits: [target, branch.commit.commit.hash] });
									if (common.commit.hash == branch.commit.commit.hash) {
										jsh.shell.console("Merged: " + branch.name);
									} else {
										jsh.shell.console("Unmerged: " + branch.name);
									}
								});

								var trunk = getTrunk();
								var status = repository.status();
								var ahead = repository.log({ revisionRange: "origin/" + trunk + ".." });
								var behind = repository.log({ revisionRange: "..origin/" + trunk});
								jsh.shell.console("Current branch: " + status.branch.name);
								if (ahead.length) jsh.shell.console("ahead of origin/" + trunk + ": " + ahead.length);
								if (behind.length) jsh.shell.console("behind origin/" + trunk + ": " + behind.length);
								if (behind.length && !ahead.length && !status.paths) {
									jsh.shell.console("Fast-forwarding ...");
									repository.merge({ ffOnly: true, name: "origin/" + trunk });
								}
							}
						),
						prune: function(p) {
							$api.fp.world.now.action(cleanGitBranches);
						}
					} : void(0)
				}
			)();
		}

		$exports.merge = $api.fp.pipe(
			/**
			 *
			 * @param { slime.jsh.script.cli.Invocation<slime.jsh.wf.standard.Options & { branch: string }> } p
			 */
			function(p) {
				var rv = {
					options: $api.Object.compose(p.options),
					arguments: []
				};
				for (var i=0; i<p.arguments.length; i++) {
					if (i == 0) {
						rv.options.branch = p.arguments[0];
					} else {
						throw new Error("Unexpected arguments.");
					}
				}
				return rv;
			},
			function(p) {
				var repository = jsh.tools.git.oo.Repository({ directory: $context.base });
				//	TODO	deal with non-zero exit code
				repository.merge({ name: p.options.branch, noCommit: true });
			}
		)

		$exports.docker = (
			function() {
				var containerListAll = {
					invocation: function() {
						return {
							command: ["container", "ls"],
							arguments: ["-a"]
						}
					},
					output: {
						json: true,
						truncated: true
					},
					result: function(json) {
						return json;
					}
				};

				var containerExists = function(name) {
					var containers = jsh.tools.docker.engine.cli.command(containerListAll).input(void(0)).run({
						stderr: function(e) {
							if (e.detail) jsh.shell.console("STDERR: [" + e.detail + "]");
						}
					});
					return containers.some(function(container) {
						return container.Names == name;
					});
				};

				var containerRemove = {
					invocation: function(name) {
						return {
							command: ["container", "rm"],
							arguments: ["-f", name]
						}
					},
					output: {
						json: false,
						truncated: false
					},
					result: function(output) {
						return output;
					}
				}

				var docker = jsh.shell.PATH.getCommand("docker");

				var initialize = function() {
					jsh.shell.run({
						command: docker,
						arguments: [
							"build",
							".",
							"-t", "davidpcaldwell/slime"
						],
						directory: $context.base
					});
					if (containerExists("slime-test")) {
						//	TODO	what if it's running?
						jsh.tools.docker.engine.cli.command(containerRemove).input("slime-test").run({
							stderr: function(e) {
								if (e.detail) jsh.shell.console("container rm -f STDERR: [" + e.detail + "]");
							}
						})
					}
				}

				//	TODO	all of this is duplicative of the shell script in contributor/, and should be used to invoke that
				//			instead
				/** @type { (args: string[]) => slime.jrunscript.shell.run.Intention } */
				var getIntention = function(args) {
					return {
						command: "bash",
						arguments: $api.Array.build(function(rv) {
							rv.push($context.base.getFile("contributor/docker-compose").toString());
							rv.push.apply(rv, args);
						}),
						stdio: {
							output: "line",
							error: "line"
						},
						directory: $context.base.pathname.toString()
					};
				};

				/** @type { slime.$api.event.Handlers<slime.jrunscript.shell.run.AskEvents> } */
				var handler = {
					stdout: function(e) {
						jsh.shell.echo(e.detail.line);
					},
					stderr: function(e) {
						jsh.shell.console(e.detail.line);
					}
				};

				var shell = $api.fp.world.mapping(
					jsh.shell.subprocess.question,
					handler
				);

				/** @type { (getComposeArguments: (invocation: slime.jsh.script.cli.Invocation<{}>) => string[]) => slime.jsh.script.cli.Command<{}> } */
				var command = function(getComposeArguments) {
					return function(p) {
						//	TODO	need wo API for this
						if (!jsh.shell.PATH.getCommand("docker")) {
							jsh.shell.console("'docker' not found; cannot run Docker-based commands.");
							return 1;
						}

						var build = $api.fp.now.invoke(
							getIntention(["build"]),
							shell,
							$api.fp.property("status")
						);

						if (build != 0) return build;

						/** @type { slime.jrunscript.shell.run.Intention } */
						var intention = getIntention($api.Array.build(function(rv) {
							var x = getComposeArguments(p);
							rv.push.apply(rv, x);
						}));

						return $api.fp.now.invoke(
							intention,
							shell,
							$api.fp.property("status")
						);
					}
				}

				return {
					fifty: command(function(p) {
						return $api.Array.build(function(rv) {
							rv.push("run");
							rv.push("box");
							rv.push("./fifty");
							rv.push.apply(rv, p.arguments);
						})
					}),
					run: command(function(p) {
						return $api.Array.build(function(rv) {
							rv.push("run");
							rv.push.apply(rv, p.arguments);
						});
					})
				}
			}
		)();

		//	TODO	implement generation of git hooks so that we can get rid of separate pre-commit implementation

		//	TODO	figure out whether there is anything to be harvested from the below or whether it can simply be removed
		if (false) $exports.commit = $api.fp.pipe(
			/**
			 *
			 * @param { slime.jsh.script.cli.Invocation<slime.jsh.wf.standard.Options & { message: string }> } p
			 */
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
				if (!p.options.message) {
					jsh.shell.console("Required: commit message (-m <message>).");
					jsh.shell.exit(1);
				}
				var repository = jsh.tools.git.oo.Repository({ directory: $context.base });

				jsh.wf.requireGitIdentity({
					repository: repository,
					get: jsh.wf.requireGitIdentity.get.gui
				});

				jsh.wf.prohibitUntrackedFiles({
					repository: repository
				}, {
					untracked: function(e) {
						jsh.shell.console("Untracked files are present; aborting:");
						jsh.shell.console(e.detail.join("\n"));
						jsh.shell.exit(1);
					}
				});

				//	Below was replaced by new linting API
				//noTrailingWhitespace();

				jsh.shell.jsh({
					shell: jsh.shell.jsh.src,
					script: $context.base.getFile("contributor/eslint.jsh.js"),
					stdio: {
						output: null
					},
					evaluate: function(result) {
						if (result.status) {
							jsh.shell.console("ESLint status: " + result.status + "; failing.");
							jsh.shell.exit(result.status);
						} else {
							jsh.shell.console("ESLint passed.");
						}
					}
				});

				jsh.wf.typescript.tsc();

				//	Runs test suite
				var timestamp = jsh.time.When.now();
				var logs = $context.base.getRelativePath("local/wf/logs/commit").createDirectory({
					recursive: true,
					exists: function(dir) { return false; }
				}).getRelativePath(timestamp.local().format("yyyy.mm.dd.HR.mi.sc")).createDirectory();
				var stdio = {
					output: logs.getRelativePath("stdout.txt").write(jsh.io.Streams.text),
					error: logs.getRelativePath("stderr.txt").write(jsh.io.Streams.text)
				};
				jsh.shell.run({
					command: $context.base.getRelativePath("jsh.bash"),
					arguments: [
						"--install-jdk"
					]
				});
				jsh.shell.run({
					command: $context.base.getRelativePath("jsh.bash"),
					arguments: [
						$context.base.getRelativePath("jsh/tools/install/rhino.jsh.js"),
						"--replace"
					]
				});
				jsh.shell.console("Running tests with output to " + logs + " ...");
				var invocation = {
					command: jsh.shell.jsh.src.getFile("jsh.bash"),
					arguments: [
						$context.base.getFile("contributor/suite.jsh.js")
					],
					stdio: {
						output: {
							line: function(line) {
								stdio.output.write(line + "\n");
							}
						},
						error: {
							line: function(line) {
								stdio.error.write(line + "\n");
							}
						}
					},
					evaluate: function(result) {
						if (result.status != 0) {
							jsh.shell.console("Failing because tests failed.");
							jsh.shell.console("Output directory: " + logs);
							jsh.shell.exit(1);
						} else {
							jsh.shell.console("Tests passed.");
						}
					}
				};
				jsh.shell.run(invocation);

				repository.commit({
					all: true,
					noVerify: true,
					message: p.options.message
				});
				jsh.shell.console("Committed changes to " + repository.directory);
				//	TODO	add conditional push; see issue #166
			}
		)

		/** @type { (p: slime.jrunscript.file.Directory) => void } */
		var deleteContents = $api.fp.pipe(
			function(dir) { return dir.pathname.toString() },
			jsh.file.state.list,
			function(f) {
				return f();
			},
			$api.fp.Array.map($api.fp.property("absolute")),
			$api.fp.Array.map(jsh.file.action.delete),
			function(p) {
				p.forEach(function(deletion) {
					deletion({
						deleted: function(e) {
							jsh.shell.console("Deleted: " + e.detail);
						}
					})
				})
			}
		)

		/** @type { (p: string) => void } */
		var deleteIfExists = $$api.Function.switch(
			{
				case: function(p) {
					return Boolean($context.base.getSubdirectory(p));
				},
				use: function(p) {
					deleteContents($context.base.getSubdirectory(p));
				}
			},
			{
				case: $api.fp.returning(true),
				use: function(p) {
					jsh.shell.console("Not found: " + $context.base.getRelativePath(p));
				}
			}
		)

		$exports.purge = function(p) {
			deleteIfExists("local/wf/logs/commit");
			deleteIfExists("local/wf/logs/test");
		}
	}
//@ts-ignore
)(Packages,$api,jsh,$context,$loader,$exports);
