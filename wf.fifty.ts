//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.wf {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	namespace test {
		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			const { $api, jsh } = fifty.global;
			const fixtures = (
				function() {
					var script: slime.jsh.wf.test.Script = fifty.$loader.script("tools/wf/test/fixtures.ts");
					return script({
						$api: $api,
						jsh: jsh
					});
				}
			)();
			return {
				clone: function() {
					return fixtures.clone({
						src: jsh.file.world.filesystems.os.pathname(fifty.jsh.file.relative(".").pathname)
					});
				},
				configure: fixtures.configure,
				wf: function(repository: slime.jrunscript.tools.git.repository.Local, p: { arguments: string[], environment?: { [variable: string]: string } }): { status: number, stdio?: { output?: string, error?: string }} {
					return jsh.shell.run({
						command: repository.directory.getFile("wf"),
						arguments: p.arguments,
						environment: Object.assign({}, jsh.shell.environment, {
							JSH_USER_JDKS: "/dev/null"
						}, p.environment || {}),
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
		git: slime.jsh.wf.standard.Interface["git"] & {
			/**
			 * Creates a branch based on the current `master` from `origin` and checks it out. The first argument is used as
			 * the branch name.
			 */
			branch: slime.jsh.script.cli.Command<Options>

			trunk: slime.jsh.script.cli.Command<Options>

			branches: {
				list: slime.jsh.script.cli.Command<Options>
				prune: slime.jsh.script.cli.Command<Options>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.manual.issue407 = function() {
				var target = test.fixtures.clone();
				test.fixtures.configure(target);
				var repository = jsh.tools.git.program({ command: "git" }).repository(target.directory.toString());

				function showStatus() {
					var status = repository.command(jsh.tools.git.commands.status).argument().run();
					jsh.shell.console(JSON.stringify(status));
				}

				showStatus();

				var branch: slime.jrunscript.tools.git.Command<string,void> = {
					invocation: function(p) {
						return {
							command: "branch",
							arguments: [p]
						}
					}
				};

				var checkout: slime.jrunscript.tools.git.Command<string,void> = {
					invocation: function(p) {
						return {
							command: "checkout",
							arguments: [p]
						}
					}
				};

				var showOrigin: slime.jrunscript.tools.git.Command<void,string> = {
					invocation: function() {
						return {
							command: "remote",
							arguments: ["show", "origin"]
						}
					},
					result: function(output) {
						return output;
					}
				};

				repository.command(branch).argument("foobar").run();
				repository.command(checkout).argument("foobar").run();

				showStatus();

				jsh.shell.console(repository.command(showOrigin).argument().run());

				test.fixtures.wf(target, {
					arguments: [
						"git.branches.prune"
					]
				});
			}
		}
	//@ts-ignore
	)(fifty);

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

		merge: slime.jsh.script.cli.Command<Options>

		docker: {
			fifty: slime.jsh.script.cli.Command<Options>
		}

		purge: slime.jsh.script.cli.Command<Options>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.requireGitIdentityDuringInitialize = function() {
				[true,false].forEach(function(configured) {
					var fresh = test.fixtures.clone();
					if (configured) test.fixtures.configure(fresh);
					var result = test.fixtures.wf(fresh, {
						arguments: ["initialize", "--test-git-identity-requirement"],
						environment: {
							SLIME_WF_SKIP_GIT_IDENTITY_REQUIREMENT: null
						}
					});
					var expected = (configured) ? 0 : 1;
					fifty.verify(result).status.is(expected);
					if (result.status != expected) {
						jsh.shell.console("Output:");
						jsh.shell.console(result.stdio.output);
						jsh.shell.console("Console:");
						jsh.shell.console(result.stdio.error);
					}
				});
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

				fifty.run(fifty.tests.requireGitIdentityDuringInitialize);
			}

			fifty.tests.manual.fixtures = {
				clone: function() {
					var clone = test.fixtures.clone();
					jsh.shell.console("clone = " + clone);
				}
			}
		}
	//@ts-ignore
	)(fifty);
}
