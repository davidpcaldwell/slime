//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	export namespace project.wf {
		namespace test {
			export const fixtures = (function(fifty: slime.fifty.test.kit) {
				const jsh = fifty.global.jsh;
				return {
					clone: function() {
						var src : slime.jrunscript.file.Directory = fifty.$loader.getRelativePath(".").directory;
						var origin = new jsh.tools.git.Repository({ directory: src });
						var rv = origin.clone({ to: fifty.jsh.file.location() });
						//	copy code so that we get local modifications in our "clone"
						src.copy(rv.directory.pathname, {
							filter: function(p) {
								//	TODO	need to review copy implementation; how do directories work?
								if (p.entry.path == ".git") return false;
								if (p.entry.path == "local") return false;
								if (p.entry.path.substring(0,"local/".length) == "local/") return false;
								if (p.entry.path.substring(0,".git/".length) == ".git/") return false;
								if (p.exists && !p.exists.directory && p.entry.node.directory) {
									p.exists.remove();
									return true;
								}
							return true;
							}
						});
						return rv;
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
					configure: function(repository: slime.jrunscript.git.repository.Local) {
						repository.config({ set: { name: "user.name", value: "foo" }});
						repository.config({ set: { name: "user.email", value: "bar@example.com" }});
					},
					wf: function(repository: slime.jrunscript.git.repository.Local, p: any): { status: number, stdio: { output: string, error: string }} {
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

			git: {
				branches: {
					clean: slime.jsh.script.cli.Command<Options>
					list: slime.jsh.script.cli.Command<Options>
				}
			}

			merge: slime.jsh.script.cli.Command<Options>

			docker: {
				test: slime.jsh.script.cli.Command<Options>
			}

			purge: slime.jsh.script.cli.Command<Options>
		}

		(
			function(
				fifty: slime.fifty.test.kit
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
						var result = test.fixtures.wf(fresh, {
							arguments: ["initialize"]
						});
						fifty.verify(result).status.is(0);
						if (result.status != 0) {
							fifty.global.jsh.shell.console(result.stdio.output);
							fifty.global.jsh.shell.console(result.stdio.error);
						}
						fifty.verify(fresh).directory.getSubdirectory("local/jsh/lib/node/lib/node_modules/eslint").is.type("object");
						fifty.verify(fresh).directory.getSubdirectory("local/jsh/lib/node/lib/node_modules/foo").is.type("null");
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