//@ts-check
(
	/**
	 * @param { jsh } jsh
	 * @param { slime.jrunscript.file.Directory } base
	 */
	function main(jsh,base) {
		var repository = jsh.tools.git.Repository({ directory: base });

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

		var code = jsh.loader.module(jsh.script.file.parent.parent.getRelativePath("code/module.js"));
		var failed = false;
		code.files.trailingWhitespace({
			base: base,
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
				if (entry.path == "tools/wf") return true;
				if (entry.path == "wf") return true;
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

		jsh.shell.jsh({
			shell: jsh.shell.jsh.src,
			script: jsh.script.file.parent.parent.getFile("eslint.jsh.js"),
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
			command: jsh.script.file.parent.parent.parent.getFile("tools/tsc.bash")
		});

		//	Runs test suite
		var timestamp = jsh.time.When.now();
		var logs = jsh.script.file.parent.parent.parent.getRelativePath("local/contribute/logs").createDirectory({
			recursive: true,
			exists: function(dir) { return false; }
		}).getRelativePath(timestamp.local().format("yyyy.mm.dd.HR.mi.sc")).createDirectory();
		var stdio = {
			output: logs.getRelativePath("stdout.txt").write(jsh.io.Streams.text),
			error: logs.getRelativePath("stderr.txt").write(jsh.io.Streams.text)
		};
		jsh.shell.console("Running tests with output to " + logs + " ...");
		var TEST_GIT_ISSUE = false;
		var invocation = {
			shell: jsh.script.file.parent.parent.parent,
			script: jsh.script.file.parent.parent.parent.getFile("contributor/suite.jsh.js"),
			arguments: [
				"-issue138"
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
		if (TEST_GIT_ISSUE) {
			invocation.script = jsh.script.file.parent.parent.parent.getFile("contributor/jrunscript.jsh.js");
			invocation.arguments = ["-part", "jrunscript/tools/git"]
		}
		jsh.shell.jsh(invocation);

		if (jsh.shell.environment.SLIME_GIT_HOOK_FAIL) {
			jsh.shell.console("Failing due to present of environment variable SLIME_GIT_HOOK_FAIL.");
			jsh.shell.exit(1);
		}
	}
//@ts-ignore
)(jsh,jsh.script.file.parent.parent.parent)
