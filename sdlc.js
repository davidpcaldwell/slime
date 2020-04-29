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
			if (entry.path == "sdlc") return true;
			if (entry.path == "tools/sdlc") return true;
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

$exports.git = {
	branches: new function() {
		var repository = jsh.tools.git.Repository({ directory: $context.base });

		var notMaster = function(branch) {
			return branch.name != "remotes/origin/master" && branch.name != "master";
		};

		this.clean = $api.Function.pipe(
			function(p) {
				/** @type { slime.jrunscript.git.Branch[] } */
				var branches = repository.branch({ all: true });
				var target = "remotes/origin/master";
				branches.filter(notMaster).forEach(function(branch) {
					var common = repository.mergeBase({ commits: [target, branch.commit.commit.hash] });
					if (common.commit.hash == branch.commit.commit.hash) {
						if (/^remotes\//.test(branch.name)) {
							jsh.shell.console("Merged; doing nothing: " + branch.name);
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

		jsh.sdlc.requireGitIdentity({
			repository: repository,
			get: jsh.sdlc.requireGitIdentity.get.gui
		});

		jsh.sdlc.prohibitUntrackedFiles({
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
			evaluate: function(result) {
				if (result.status) {
					jsh.shell.console("ESLint status: " + result.status + "; failing.");
					jsh.shell.exit(result.status);
				} else {
					jsh.shell.console("ESLint passed.");
				}
			}
		});

		jsh.shell.run({
			command: $context.base.getFile("contributor/tsc.bash")
		});

		//	Runs test suite
		var timestamp = jsh.time.When.now();
		var logs = $context.base.getRelativePath("local/sdlc/logs/commit").createDirectory({
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
	}
)