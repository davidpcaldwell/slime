//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	export namespace project.wf {
		namespace test {
			export const fixtures = (function(fifty: slime.fifty.test.Kit) {
				const { $api, jsh } = fifty.global;
				var script: slime.jsh.wf.test.Script = fifty.$loader.script("tools/wf/test/fixtures.ts");
				var x = script();
				return {
					clone: function() {
						type Repository = ReturnType<ReturnType<slime.jrunscript.tools.git.Exports["program"]>["repository"]>
						var clone: slime.jrunscript.tools.git.Command<{ repository: string, to: string }, Repository> = {
							invocation: function(p) {
								return {
									command: "clone",
									arguments: $api.Array.build(function(rv) {
										rv.push(p.repository);
										if (p.to) rv.push(p.to);
									})
								}
							}
						};
						var src: slime.jrunscript.file.world.Pathname = fifty.jsh.file.relative(".");
						var destination = fifty.jsh.file.temporary.directory();
						jsh.tools.git.program({ command: "git" }).command(clone).argument({
							repository: src.pathname,
							to: destination.pathname
						}).run();
						//	copy code so that we get local modifications in our "clone"
						jsh.file.object.directory(src).copy(jsh.file.object.pathname(destination), {
							filter: function(p) {
								//	TODO	need to review copy implementation; how do directories work?
								if (p.entry.path == ".git") return false;
								if (p.entry.path == "local") return false;
								if (p.entry.path.substring(0,"local/".length) == "local/") return false;
								if (p.entry.path.substring(0,".git/".length) == ".git/") return false;

								//	If we are a directory but the clone contains a file, remove the directory and overwrite
								if (p.exists && !p.exists.directory && p.entry.node.directory) {
									p.exists.remove();
									return true;
								}

								return true;
							}
						});
						return jsh.tools.git.Repository({ directory: jsh.file.Pathname(destination.pathname).directory });
						//	good utility functions for git module?
						// function unset(repository,setting) {
						// 	jsh.shell.console("Unset: " + repository.directory);
						// 	jsh.shell.run({
						// 		command: "git",
						// 		arguments: ["config", "--local", "--unset", setting],
						// 		directory: repository.directory
						// 	});
						// }
						// var gitdir = (function() {
						// 	if (src.getSubdirectory(".git")) {
						// 		return src.getSubdirectory(".git");
						// 	}
						// 	if (src.getFile(".git")) {
						// 		var parsed = /^gitdir\: (.*)/.exec(src.getFile(".git").read(String));
						// 		var relative = (parsed) ? parsed[1] : null;
						// 		return (relative) ? src.getRelativePath(relative).directory : void(0);
						// 	}
						// })();
					},
					configure: x.configure,
					wf: function(repository: slime.jrunscript.tools.git.repository.Local, p: any): { status: number, stdio?: { output?: string, error?: string }} {
						return jsh.shell.run({
							command: repository.directory.getFile("wf"),
							arguments: p.arguments,
							environment: Object.assign({}, jsh.shell.environment, {
								JSH_USER_JDKS: "/dev/null"
							}),
							stdio: {
								output: String,
								error: String
							},
							evaluate: function(result) { return result; }
						});
					}
				};
			//@ts-ignore
			})(fifty)
		}

		type Options = {}

		export interface Interface extends slime.jsh.wf.standard.Interface {
			/**
			 * If this project is operating as an Eclipse project (including VSCode), ensures that project-specified Eclipse settings
			 * are provided.
			 */
			initialize: slime.jsh.wf.cli.Interface<any>["initialize"]

			vscode: {
				java: {
					/**
					 * Removes the VSCode extension information about the project and explains how to regenerate it.
					 */
					refresh: slime.jsh.script.cli.Command<Options>
				}
			}

			/**
			 * Runs linting and TypeScript compiler. Used as part of Git pre-commit hook installed by initialize.
			 */
			precommit: slime.jsh.script.cli.Command<Options>

			/**
			 * Runs linting, TypeScript compiler, and tests. Used as part of GitHub Action pre-merge check.
			 */
			check: slime.jsh.script.cli.Command<Options & {
				docker: boolean
			}>

			git: {
				/**
				 * Creates a branch based on the current `master` from `origin` and checks it out. The first argument is used as
				 * the branch name.
				 */
				branch: slime.jsh.script.cli.Command<Options>

				branches: {
					clean: slime.jsh.script.cli.Command<Options>
					list: slime.jsh.script.cli.Command<Options>
				}
			}

			merge: slime.jsh.script.cli.Command<Options>

			docker: {
				fifty: slime.jsh.script.cli.Command<Options>
				test: slime.jsh.script.cli.Command<Options>
			}

			purge: slime.jsh.script.cli.Command<Options>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.fixtures = {
					clone: function() {
						var clone = test.fixtures.clone();
						jsh.shell.console("clone = " + clone);
					}
				}

				fifty.tests.suite = function() {
					fifty.run(function ensureInitializeInstallsEslint() {
						var fresh = test.fixtures.clone();
						test.fixtures.configure(fresh);

						fifty.verify(fresh).directory.getSubdirectory("local/jsh/lib/node/lib/node_modules/eslint").is.type("null");

						var result = test.fixtures.wf(fresh, {
							arguments: ["initialize"]
						});
						fifty.verify(result).status.is(0);
						if (result.status != 0) {
							fifty.global.jsh.shell.console(result.stdio.output);
							fifty.global.jsh.shell.console(result.stdio.error);
						}
						fifty.verify(fresh).directory.getSubdirectory("local/jsh/lib/node/lib/node_modules/eslint").is.type("object");
					});

					fifty.run(function requireGitIdentityDuringInitialize() {
						[true,false].forEach(function(configured) {
							var fresh = test.fixtures.clone();
							if (configured) test.fixtures.configure(fresh);
							var result = test.fixtures.wf(fresh, {
								arguments: ["initialize", "--test-git-identity-requirement"]
							});
							var expected = (configured) ? 0 : 1;
							fifty.verify(result).status.is(expected);
						});
					})
				}
			}
		//@ts-ignore
		)(fifty);

	}
}
