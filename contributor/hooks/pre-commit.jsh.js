//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jsh.Global } jsh
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

		var loader = new jsh.file.Loader({ directory: jsh.script.file.parent.parent });
		/** @type { slime.project.code.Script } */
		var script = loader.script("code/module.js");
		var code = script({
			console: jsh.shell.console,
			library: {
				file: jsh.file,
				code: jsh.tools.code
			}
		});
		var failed = false;
		code.files.trailingWhitespace({
			base: base,
		})(code.files.toHandler({
			unknownFileType: function(entry) {
				throw new Error("Unknown file type; cannot determine whether text: " + entry.file);
			},
			change: function(p) {
				jsh.shell.console("Changed " + p.file.path + " at line " + p.line.number);
			},
			changed: function(entry) {
				jsh.shell.console("Modified: " + entry.file);
				failed = true;
			},
			unchanged: function(entry) {
				//jsh.shell.echo("No change: " + entry.node);
			}
		}));
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
