//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.wf.cli.Context } $context
	 * @param { slime.project.wf.Interface } $exports
	 */
	function($api,jsh,$context,$exports) {
		var noTrailingWhitespace = function() {
			var code = jsh.loader.module($context.base.getRelativePath("contributor/code/module.js"));
			var failed = false;
			code.files.trailingWhitespace({
				base: $context.base,
				isText: function(entry) {
					if (/\.def$/.test(entry.path)) return true;
					if (/\.prefs$/.test(entry.path)) return true;
					if (/\.py$/.test(entry.path)) return true;

					if (entry.path == ".hgsub") return true;
					if (entry.path == ".hgignore") return true;
					if (entry.path == ".gitignore") return true;

					//	Really should ignore these files because they are VCS-ignored, not because they are binary
					if (entry.path == ".classpath") return false;
					if (entry.path == ".project") return false;
					if (entry.path == ".hgsubstate") return false;

					if (entry.path == "wf") return true;
					if (entry.path == "tools/wf") return true;
					if (entry.path == "contributor/hooks/pre-commit") return true;
					return code.files.isText(entry.node);
				},
				on: {
					unknownFileType: function(entry) {
						throw new Error("Unknown file type; cannot determine whether text: " + entry.node);
					},
					change: function(p) {
						jsh.shell.console("Changed " + p.path + " at line " + p.line.number);
					},
					changed: function(entry) {
						jsh.shell.console("Modified: " + entry.node);
						failed = true;
					},
					unchanged: function(entry) {
						//jsh.shell.echo("No change: " + entry.node);
					}
				}
			});
			if (failed) {
				jsh.shell.console("Failing because trailing whitespace was modified.");
				return false;
			}
			return true;
		};

		function synchronizeEclipseSettings() {
			//	copy project settings to Eclipse project if they differ from current settings
			var filename = "org.eclipse.jdt.core.prefs";
			var destination = $context.base.getSubdirectory(".settings").getRelativePath(filename);
			var now = (destination.file) ? destination.file.read(String) : void(0);
			var after = $context.base.getFile("tools/" + filename).read(String);
			if (now != after) {
				$context.base.getFile("tools/" + filename).copy(
					$context.base.getSubdirectory(".settings").getRelativePath(filename),
					{
						filter: function() {
							return true;
						}
					}
				);
				jsh.shell.console("VSCode: Execute the 'Java: Clean the Java language server workspace' command to update Hava settubgs.");
			}
		}

		$exports.initialize = function(p) {
			//	TODO	could consider whether we can wire our commit process into the git hooks mechanism:
			//			git config core.hooksPath contributor/hooks
			//			... and then appropriately implement contributor/hooks/pre-commit

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

			jsh.shell.tools.node.require();
			jsh.shell.tools.node.modules.require({ name: "eslint" });

			var isEclipseProject = Boolean($context.base.getSubdirectory(".settings"));
			if (isEclipseProject) {
				synchronizeEclipseSettings();
			}
		};

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

		/**
		 * @param { { logs: slime.jrunscript.file.Directory } } p
		 */
		var test = function(p) {
			var logs = p.logs;
			var stdio = (logs) ? {
				output: logs.getRelativePath("stdout.txt").write(jsh.io.Streams.text),
				error: logs.getRelativePath("stderr.txt").write(jsh.io.Streams.text)
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
			var invocation = {
				command: "bash",
				arguments: [
					jsh.shell.jsh.src.getFile("jsh.bash"),
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
					}
				}
			};
			jsh.shell.run(invocation);
			//	TODO	adapt the jsh.shell.exit-based status handling above to the boolean handling desired here
			return true;
		};

		jsh.wf.project.initialize(
			$context,
			{
				lint: function() {
					var success = noTrailingWhitespace();
					if (!success) return false;

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

					return success;
				},
				test: function() {
					var timestamp = jsh.time.When.now();
					var logs = $context.base.getRelativePath("local/wf/logs/commit").createDirectory({
						recursive: true,
						exists: function(dir) { return false; }
					}).getRelativePath(timestamp.local().format("yyyy.mm.dd.HR.mi.sc")).createDirectory();
					return test({ logs: logs });
				}
			},
			$exports
		)

		$exports.git = {
			branches: new function() {
				var repository = jsh.tools.git.Repository({ directory: $context.base });

				var notMaster = function(branch) {
					return branch.name != "remotes/origin/master" && branch.name != "master";
				};

				this.clean = $api.Function.pipe(
					function(p) {
						repository.fetch({ all: true, prune: true, recurseSubmodules: true, stdio: { output: null } });
						/** @type { slime.jrunscript.git.Branch[] } */
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

				this.list = $api.Function.pipe(
					function(p) {
						repository.fetch({ all: true, prune: true, recurseSubmodules: true, stdio: { output: null } });
						/** @type { slime.jrunscript.git.Branch[] } */
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
			}
		}

		$exports.merge = $api.Function.pipe(
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

		$exports.test = $api.Function.pipe(
			jsh.script.cli.option.boolean({ longname: "stdio" }),
			jsh.script.cli.option.string({ longname: "logs" }),
			function(p) {
				var logs = (function(stdio,logs) {
					if (stdio) return void(0);
					var directory = $context.base.getRelativePath("local/wf/logs/test").createDirectory({
						recursive: true,
						exists: function(dir) { return false; }
					});
					if (!logs) logs = jsh.time.When.now().local().format("yyyy.mm.dd.HR.mi.sc");
					return directory.getRelativePath(logs).createDirectory({
						//	might exist because docker creates it when mapping container directory to host directory
						exists: $api.Function.returning(false)
					});
				})(p.options.stdio,p.options.logs);
				test({ logs: logs });
			}
		)

		$exports.docker = {
			test: function(p) {
				var docker = jsh.shell.PATH.getCommand("docker");
				var logs = $context.base.getRelativePath("local/wf/logs/docker.test");
				//	directory will be created by docker command below; we do this to empty it
				if (logs.directory) logs.directory.remove();
				//	delta
				jsh.shell.run({
					command: docker,
					arguments: [
						"build",
						".",
						"-t", "davidpcaldwell/slime"
					],
					directory: $context.base
				});
				jsh.shell.run({
					command: docker,
					arguments: [
						"run",
						"--name", "slime-test",
						"-v", logs + ":" + "/slime/local/wf/logs/test/current/",
						"davidpcaldwell/slime",
						"/slime/wf", "test",
						"--logs", "current"
						/*, "--stdio"*/
					]
				});
			}
		}

		//	TODO	implement generation of git hooks so that we can get rid of separate pre-commit implementation
		if (false) $exports.commit = $api.Function.pipe(
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

				noTrailingWhitespace();

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
	}
//@ts-ignore
)($api,jsh,$context,$exports);
