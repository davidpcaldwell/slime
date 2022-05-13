//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.wf.cli.Context } $context
	 * @param { slime.project.wf.Interface } $exports
	 */
	function($api,jsh,$context,$exports) {
		function synchronizeEclipseSettings() {
			//	copy project settings to Eclipse project if they differ from current settings
			var changed = false;
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
			if (changed) jsh.shell.console("VSCode: Execute the 'Java: Clean the Java language server workspace' command to update Java settubgs.");
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
				},
				/**
				 * @type { slime.jrunscript.tools.git.Command<string,{ head: string }> }
				 */
				remoteShow: {
					invocation: function(name) {
						return {
							command: "remote",
							arguments: ["show", name]
						};
					},
					result: function(output) {
						var lines = output.split("\n");
						var parser = /HEAD branch\: (.*)/;
						var branch = parser.exec(lines[3])[1];
						return {
							head: branch
						}
					}
				}
			}
		};

		$exports.initialize = $api.Function.pipe(
			function(p) {
				jsh.wf.project.git.installHooks({ path: "contributor/hooks" });
				//	TODO	could consider whether we can wire our commit process into the git hooks mechanism:
				//			git config core.hooksPath contributor/hooks
				//			... and then appropriately implement contributor/hooks/pre-commit

				//	Provided for testing, allows an automated test to initialize without GUI prompting for git identity
				//	Currently used by plugin-standard.jsh.fifty.ts to install TypeScript types so tsc passes in parent project
				var skipGitIdentityRequirement =
					(p && p.arguments[0] == "--test-skip-git-identity-requirement")
					|| jsh.shell.environment.SLIME_WF_SKIP_GIT_IDENTITY_REEQUIREMENT
				;

				if (!skipGitIdentityRequirement) {
					var gitIdentityProvider = (p && p.arguments[0] == "--test-git-identity-requirement") ? void(0) : jsh.wf.requireGitIdentity.get.gui;

					try {
						jsh.wf.requireGitIdentity({
							repository: jsh.tools.git.Repository({ directory: $context.base }),
							get: gitIdentityProvider
						});
					} catch (e) {
						//	TODO	returning 1 here apparently does not function as expected. Perhaps wf still has a disjoint
						//			implementation from jsh.script.cli?
						jsh.shell.console("user.name and user.email must be set on the local repository.");
						jsh.shell.console("From the source directory " + $context.base + ":");
						jsh.shell.console("git config user.name \"Your Name\"");
						jsh.shell.console("git config user.email \"youremail@yourdomain.com\"");
						jsh.shell.exit(1);
					}
				}

				jsh.shell.tools.node.require();
				jsh.shell.tools.node["modules"].require({ name: "eslint" });
				jsh.shell.tools.node["modules"].require({ name: "@types/js-yaml" });

				var isEclipseProject = Boolean($context.base.getSubdirectory(".settings"));
				if (isEclipseProject) {
					synchronizeEclipseSettings();
				}

				//	Required for old loader/document implementation
				jsh.shell.tools.jsoup.require();

				(function wiki() {
					if (!jsh.tools.git.Repository) return;
					var remote = jsh.tools.git.Repository({ remote: "https://github.com/davidpcaldwell/slime.wiki.git" });
					var location = $context.base.getRelativePath("local/wiki");
					if (!location.directory) {
						remote.clone({ to: location });
					}
				})();
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
					jsh.shell.console("VSCode: Execute the 'Java: Clean the Java language server workspace' command.");
					jsh.shell.console("When prompted, choose Restart and delete.");
					jsh.shell.console("When prompted to import Java projects in the workspace, choose Yes.");
					jsh.shell.console("After the import is complete, run the wf initialize command and follow its instructions.");
				}
			}
		}

		var lint = function() {
			var success = true;

			jsh.shell.console("Checking for trailing whitespace ...");
			jsh.tools.code.handleTrailingWhitespace({
				base: $context.base,
				exclude: jsh.project.code.files.exclude,
				isText: jsh.project.code.files.isText,
				nowrite: false
			})({
				unknownFileType: function(e) {
					jsh.shell.console("Could not determine whether file is text or binary: " + e.detail.path);
					success = false;
				},
				foundAt: function(e) {
					jsh.shell.console("Found trailing whitespace: " + e.detail.file.path + " line " + e.detail.line.number);
					success = false;
				}
			});

			jsh.shell.console("Handling final newlines ...");
			jsh.tools.code.handleFinalNewlines({
				base: $context.base,
				exclude: jsh.project.code.files.exclude,
				isText: jsh.project.code.files.isText,
				nowrite: false
			})({
				unknownFileType: function(e) {
					jsh.shell.console("Could not determine whether file is text or binary: " + e.detail.path);
					success = false;
				},
				missing: function(e) {
					jsh.shell.console("Missing final newline: " + e.detail.path);
					success = false;
				},
				multiple: function(e) {
					jsh.shell.console("Multiple final newlines: " + e.detail.path);
					success = false;
				}
			});

			jsh.shell.console("Running ESLint ...");
			jsh.shell.jsh({
				shell: jsh.shell.jsh.src,
				script: $context.base.getFile("contributor/eslint.jsh.js"),
				stdio: {
					output: null
				},
				evaluate: function(result) {
					if (result.status) {
						jsh.shell.console("ESLint status: " + result.status + "; failing.");
						success = false;
					} else {
						jsh.shell.console("ESLint passed.");
					}
				}
			});

			jsh.shell.console("Verifying MPL license headers ...");
			var license = jsh.shell.jsh({
				shell: jsh.shell.jsh.src,
				script: $context.base.getFile("contributor/code/license.jsh.js"),
				evaluate: function(result) {
					return result;
				}
			});

			if (license.status) {
				jsh.shell.console("License headers need to be updated; run:");
				jsh.shell.console("./jsh.bash contributor/code/license.jsh.js --fix");
				success = false;
			} else {
				jsh.shell.console("All license headers are correct.")
			}

			return success;
		};

		/**
		 * Runs the test suite, first installing Java, Rhino, and (if Docker testing is indicated) the Selenium Java driver.
		 * Exits the VM with exit status 1 on failure; otherwise, returns `true`.
		 *
		 * @param { { docker: boolean, logs: slime.jrunscript.file.Directory } } p
		 */
		var test = function(p) {
			if (p.docker) {
				var library = jsh.shell.jsh.lib.getRelativePath("selenium/java");

				if (!library.directory) {
					jsh.shell.console("Installing Selenium Java driver ...");
					jsh.tools.install.install({
						url: "https://github.com/SeleniumHQ/selenium/releases/download/selenium-4.1.0/selenium-java-4.1.3.zip",
						getDestinationPath: function(file) { return ""; },
						to: library
					});
				}
			}

			var logs = p.logs;
			var stdio = (logs) ? {
				output: logs.getRelativePath("stdout.txt").write(jsh.io.Streams.text, { append: false }),
				error: logs.getRelativePath("stderr.txt").write(jsh.io.Streams.text, { append: false })
			} : {
				output: {
					write: function(s) {
						jsh.shell.echo(s.substring(0,s.length-1));
					}
				},
				error: {
					write: function(s) {
						jsh.shell.console(s.substring(0,s.length-1));
					}
				}
			};
			if (!jsh.shell.environment.SLIME_WF_JDK_8) {
				jsh.shell.run({
					command: "bash",
					arguments: [
						$context.base.getRelativePath("jsh.bash"),
						"--install-jdk"
					]
				});
			}
			jsh.shell.run({
				command: "bash",
				arguments: [
					$context.base.getRelativePath("jsh.bash"),
					$context.base.getRelativePath("jsh/tools/install/rhino.jsh.js"),
					"-replace"
				]
			});
			if (logs) jsh.shell.console("Running tests with output to " + logs + " ...");
			var debugging = (jsh.shell.environment.JSH_TEST_ISSUE317) ? ["-issue317"] : [];
			var success = true;
			var invocation = {
				command: "bash",
				arguments: [
					jsh.shell.jsh.src.getFile("jsh.bash").toString(),
					$context.base.getFile("contributor/suite.jsh.js").toString()
				].concat(p.docker ? ["-docker"] : []).concat(debugging),
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
						success = false;
					}
				}
			};
			jsh.shell.run(invocation);
			//	TODO	adapt the jsh.shell.exit-based status handling above to the boolean handling desired here
			return success;
		};

		jsh.wf.project.initialize(
			$context,
			{
				lint: lint,
				test: function() {
					var success = true;

					jsh.shell.world.run(
						jsh.shell.Invocation.create({
							command: "docker",
							arguments: $api.Array.build(function(rv) {
								rv.push("compose");
								rv.push("-f", $context.base.getRelativePath("contributor/docker-compose.yaml"));
								rv.push("build", "test");
							})
						})
					)({
						exit: function(e) {
							if (e.detail.status != 0) {
								jsh.shell.console("docker compose build exit status: " + e.detail.status);
								success = false;
							}
						}
					});

					if (!success) return false;

					jsh.shell.world.run(
						jsh.shell.Invocation.create({
							command: "docker",
							arguments: $api.Array.build(function(rv) {
								rv.push("compose");
								rv.push("-f", $context.base.getRelativePath("contributor/docker-compose.yaml"));
								rv.push("run", "test");
							})
						})
					)({
						exit: function(e) {
							if (e.detail.status != 0) {
								jsh.shell.console("docker compose build exit status: " + e.detail.status);
								success = false;
							}
						}
					})

					return success;
				}
			},
			$exports
		)

		$exports.precommit = function(p) {
			var trunk = git.repository.command(git.command.remoteShow).argument("origin").run().head;
			var repository = jsh.tools.git.Repository({ directory: $context.base });
			var branch = repository.status().branch.name;
			if (branch == trunk) {
				jsh.shell.console("Cannot commit directly to " + trunk);
				return 1;
			}
			jsh.shell.console("Linting ...");
			var lintSuccess = lint();
			if (!lintSuccess) {
				jsh.shell.console("Linting failed.");
				return 1;
			}
			jsh.shell.console("Running TypeScript compiler ...");
			jsh.wf.typescript.tsc();
			jsh.shell.console("Passed.");
		};

		$exports.check = $api.Function.pipe(
			jsh.script.cli.option.boolean({ longname: "docker" }),
			function(p) {
				jsh.shell.console("Linting ...");
				var lintingPassed = lint();
				if (!lintingPassed) {
					jsh.shell.console("Linting failed.");
					return 1;
				}
				jsh.shell.console("Running TypeScript compiler ...");
				jsh.wf.typescript.tsc();
				jsh.shell.console("Running tests ...");
				var testsPassed = test({
					docker: p.options.docker,
					logs: void(0)
				});
				if (!testsPassed) {
					jsh.shell.console("Tests failed.");
					return 1;
				}
				jsh.shell.console("Passed.");
			}
		);

		if (jsh.tools.git.Repository) {
			(
				function() {
					var repository = jsh.tools.git.Repository({ directory: $context.base });

					var notMaster = function(branch) {
						return branch.name != "remotes/origin/master" && branch.name != "master";
					};

					function cleanGitBranches() {
						return $api.Function.pipe(
							function(p) {
								repository.fetch({ all: true, prune: true, recurseSubmodules: true, stdio: { output: null } });
								/** @type { slime.jrunscript.tools.git.Branch[] } */
								var branches = repository.branch({ all: true });
								var target = "remotes/origin/master";
								branches.filter(notMaster).forEach(function(branch) {
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
						);
					}

					$exports.git = {
						branch: $api.Function.pipe(
							function(p) {
								var name = p.arguments[0];
								git.repository.command(git.command.fetch).argument().run();
								git.repository.command(git.command.createBranch).argument({ name: name, startPoint: "origin/master", track: "no" }).run();
								git.repository.command(git.command.checkout).argument({ branch: name }).run();
							}
						),
						trunk: function(p) {
							/** @type { slime.jrunscript.tools.git.Command<{ name: string }, void> } */
							var merge = {
								invocation: function(p) {
									return {
										command: "merge",
										arguments: $api.Array.build(function(rv) {
											rv.push(p.name);
										})
									}
								}
							}
							git.repository.command(git.command.fetch).argument().run();
							git.repository.command(git.command.checkout).argument({ branch: "master" }).run();
							git.repository.command(merge).argument({ name: "origin/master" }).run();
							cleanGitBranches()();
						},
						branches: (jsh.tools.git.Repository) ? new function() {
							this.clean = cleanGitBranches();

							this.list = $api.Function.pipe(
								function(p) {
									repository.fetch({ all: true, prune: true, recurseSubmodules: true, stdio: { output: null } });
									/** @type { slime.jrunscript.tools.git.Branch[] } */
									var branches = repository.branch({ all: true });
									var target = "remotes/origin/master";
									branches.filter(notMaster).forEach(function(branch) {
										var common = repository.mergeBase({ commits: [target, branch.commit.commit.hash] });
										if (common.commit.hash == branch.commit.commit.hash) {
											jsh.shell.console("Merged: " + branch.name);
										} else {
											jsh.shell.console("Unmerged: " + branch.name);
										}
									});

									var status = repository.status();
									var ahead = repository.log({ revisionRange: "origin/master.." });
									var behind = repository.log({ revisionRange: "..origin/master"});
									jsh.shell.console("Current branch: " + status.branch.name);
									if (ahead.length) jsh.shell.console("ahead of origin/master: " + ahead.length);
									if (behind.length) jsh.shell.console("behind origin/master: " + behind.length);
									if (behind.length && !ahead.length && !status.paths) {
										jsh.shell.console("Fast-forwarding ...");
										repository.merge({ ffOnly: true, name: "origin/master" });
									}
								}
							);
						} : void(0)
					}
				}
			)();
		}

		$exports.merge = $api.Function.pipe(
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
				var repository = jsh.tools.git.Repository({ directory: $context.base });
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

				return {
					fifty: function(p) {
						initialize();
						jsh.shell.run({
							command: docker,
							arguments: [
								"run",
								"--name", "slime-test",
								"--workdir", "/slime",
								"davidpcaldwell/slime",
								"./fifty",
								"test.jsh"
							].concat(p.arguments)
						});
					},
					run: function(p) {
						initialize();
						jsh.shell.run({
							command: docker,
							arguments: [
								"run",
								"--name", "slime-test",
								"davidpcaldwell/slime",
								"sleep", "infinity"
							]
						});
					}
				}
			}
		)();

		//	TODO	implement generation of git hooks so that we can get rid of separate pre-commit implementation

		//	TODO	figure out whether there is anything to be harvested from the below or whether it can simply be removed
		if (false) $exports.commit = $api.Function.pipe(
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
				var repository = jsh.tools.git.Repository({ directory: $context.base });

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
						"-replace"
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
		var deleteContents = $api.Function.pipe(
			function(dir) { return dir.pathname.toString() },
			jsh.file.state.list,
			function(f) {
				return f();
			},
			$api.Function.Array.map($api.Function.property("absolute")),
			$api.Function.Array.map(jsh.file.action.delete),
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
				case: $api.Function.returning(true),
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
)($api,jsh,$context,$exports);
