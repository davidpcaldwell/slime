var noTrailingWhitespace = function() {
	var code = jsh.loader.module($context.base.getRelativePath("contributor/code/module.js"));
	var failed = false;
	code.files.trailingWhitespace({
		base: $context.base,
		isText: function(entry) {
			if (/\.def$/.test(entry.path)) return true;
			if (/\.prefs$/.test(entry.path)) return true;
			if (entry.path == ".hgsub") return true;
			if (entry.path == ".hgsubstate") return false;
			if (entry.path == ".hgignore") return false;
			if (entry.path == ".gitignore") return false;
			if (entry.path == "contributor/hooks/pre-commit") return true;
			if (entry.path == ".classpath") return false;
			if (entry.path == ".project") return false;
			if (entry.path == "contribute") return true;
			if (entry.path == "wf") return true;
			if (entry.path == "tools/wf") return true;
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
		jsh.shell.exit(1);
	}
};

$exports.initialize = function() {
	if ($context.base.getSubdirectory(".settings")) {
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
			jsh.shell.console("VSCode: Execute the 'Java: Clean the Java language server workspace' command to update.");
		}
	}
}

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

$exports.status = $api.Function.pipe(
	function(p) {
		var repository = jsh.tools.git.Repository({ directory: $context.base });
		//	TODO	add option for offline
		var branches = function(repository) {
			repository.fetch({ all: true, prune: true, recurseSubmodules: true, stdio: { output: null } });
			jsh.shell.console("Fetched updates from " + repository.remote.getUrl({ name: "origin" }));
			return repository.branch({ all: true })
		};
		var status = repository.status();
		var upstream = $api.Function.result(
			repository,
			branches,
			$api.Function.Array.find(function(branch) {
				return branch.name == "remotes/origin/" + status.branch.name;
			})
		)
		jsh.shell.console("Current branch: " + status.branch.name);
		if (upstream) {
			var vsOrigin = jsh.wf.git.compareTo(upstream.name)(repository);
			var ahead = vsOrigin.ahead;
			var behind = vsOrigin.behind;
			if (ahead.length) jsh.shell.console("ahead of " + upstream.name + ": " + ahead.length);
			if (behind.length) jsh.shell.console("behind " + upstream.name + ": " + behind.length);
		} else {
			jsh.shell.console("Upstream branch " + "origin/" + status.branch.name + " not found.");
		}

		$api.Function.result(
			status.paths,
			$api.Function.Object.entries,
			$api.Function.Array.map(function(item) {
				jsh.shell.console(item[1] + " " + item[0])
			})
		)

		if (upstream && behind.length && !ahead.length && !status.paths) {
			jsh.shell.console("Fast-forwarding ...");
			repository.merge({ ffOnly: true, name: upstream.name });
		}
	}
)

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

//	TODO	implement generation of git hooks so that we can get rid of separate pre-commit implementation
$exports.commit = $api.Function.pipe(
	function(p) {
		var rv = {
			options: $api.Object.compose(p.options),
			arguments: []
		};
		for (var i=0; i<p.arguments.length; i++) {
			if (p.arguments[i] == "-m") {
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
		jsh.shell.console("Running tests with output to " + logs + " ...");
		var invocation = {
			shell: $context.base,
			script: $context.base.getFile("contributor/suite.jsh.js"),
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
		jsh.shell.jsh(invocation);

		repository.commit({
			all: true,
			noVerify: true,
			message: p.options.message
		});
		jsh.shell.console("Committed changes to " + repository.directory);
		//	TODO	add conditional push; see issue #166
	}
)