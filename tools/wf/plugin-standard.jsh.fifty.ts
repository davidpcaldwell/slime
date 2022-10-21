//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf {
	export namespace standard {
		namespace test {
			export const fixtures = (
				function(fifty: slime.fifty.test.Kit) {
					const jsh = fifty.global.jsh;

					const fixtures = (
						function() {
							var script: slime.jsh.wf.test.Script = fifty.$loader.script("../../tools/wf/test/fixtures.ts");
							return script({
								$api: fifty.global.$api,
								jsh: fifty.global.jsh
							});
						}
					)();

					var src: slime.jrunscript.file.Directory = fifty.jsh.file.object.getRelativePath("../..").directory;

					/**
					 * Creates a project based on the project configuration in the `tools/wf/test/data/plugin-standard` directory,
					 * with user.name and user.email configured, and adds a `slime` subrepository to it at `slime/`.
					 *
					 * @returns The repository for the new project.
					 */
					function fixture() {
						var project = fifty.jsh.file.object.temporary.location();
						fifty.jsh.file.object.getRelativePath("test/data/plugin-standard").directory.copy(project);

						//	Add a sample file to the fixture
						project.directory.getRelativePath("a.js").write("", { append: false });

						var repository = jsh.tools.git.init({
							pathname: project
						});
						fixtures.configure(repository);
						repository.config({
							set: {
								name: "receive.denyCurrentBranch",
								value: "warn"
							}
						});
						repository.add({
							path: "."
						});
						var slime = fixtures.clone({
							src: jsh.file.world.spi.filesystems.os.pathname(src.toString()),
							commit: {
								message: "Local modifications"
							}
						});
						fixtures.configure(slime);
						repository.submodule.add({
							repository: slime,
							path: "slime"
						});
						repository.commit({
							all: true,
							message: "initial"
						}, {
							stdio: function(e) {
								jsh.shell.console(e.detail);
							},
							stderr: function(e) {
								jsh.shell.console(e.detail);
							}
						});
						return repository;
					}

					return {
						wf: fifty.jsh.file.object.getRelativePath("../wf.bash").file,
						test: {
							fixture: fixture
						},
						/**
						 *
						 * @param p Specifies whether to skip running `wf initialize` on the project.
						 * @returns A repository representing a project with a SLIME submodule that has an `origin` remote.
						 */
						project: function project(p?: { noInitialize?: boolean }) {
							if (!p) p = {};
							var origin = fixture();
							var repository = fixtures.clone({
								src: jsh.file.world.spi.filesystems.os.pathname(origin.directory.toString())
							});
							repository.submodule.update({
								init: true
							});
							fixtures.configure(repository);

							var slime = jsh.tools.git.Repository({ directory: repository.directory.getSubdirectory("slime") });

							//	Initialize SLIME external types (e.g., jsyaml) so that tsc will pass
							if (!p.noInitialize) (
								function wfInitialize() {
									jsh.shell.run({
										command: repository.directory.getFile("wf"),
										arguments: ["initialize"]
									});
								}
							)();

							function toGitFixturesRepository(p: slime.jrunscript.tools.git.repository.Local): slime.jrunscript.tools.git.test.fixtures.Repository {
								return {
									location: {
										filesystem: jsh.file.world.spi.filesystems.os,
										pathname: p.directory.toString()
									},
									api: jsh.tools.git.program({ command: "git" }).repository(p.directory.toString())
								}
							}

							return {
								origin: toGitFixturesRepository(origin),
								clone: toGitFixturesRepository(repository)
							};
						},
						adapt: {
							repository: function(repository: slime.jrunscript.tools.git.test.fixtures.Repository): slime.jrunscript.tools.git.repository.Local {
								return jsh.tools.git.Repository({ directory: jsh.file.Pathname(repository.location.pathname).directory });
							}
						}
					}
				}
			//@ts-ignore
			)(fifty);
		}
		export interface Project {
			lint?: slime.jsh.wf.Lint
			test?: slime.jsh.wf.Test
			precommit?: slime.jsh.wf.Precommit
		}

		export type Options = {};

		/**
		 * Implements the standard `wf` commands provided by {@link slime.jsh.wf.Exports | `jsh.wf.project.initialize()`}.
		 */
		export interface Interface {
			/**
			 * Runs `eslint` on the project; property is present only if `.eslintrc.json` is defined at the top level of the project.
			 */
			eslint?:  slime.jsh.script.cli.Command<Options>

			/**
			 * Runs the configured {@link slime.jsh.wf.Lint} check; property is present only if a lint check is provided.
			 */
			lint?: slime.jsh.script.cli.Command<Options> & {
				fix: slime.jsh.script.cli.Command<Options>
			}

			/**
			 * Runs the Typedoc documentation generator.
			 */
			typedoc:  slime.jsh.script.cli.Command<Options>

			status:  slime.jsh.script.cli.Command<Options>

			prune: slime.jsh.script.cli.Command<Options>

			test: slime.jsh.script.cli.Command<Options>

			precommit: slime.jsh.script.cli.Command<Options>

			submodule: {
				/**
				 * Completely removes a top-level submodule from the project.
				 *
				 * `--path <path-to-submodule>`
				 */
				remove:  slime.jsh.script.cli.Command<Options>

				/**
				 * `--path <path-to-submodule>`
				 */
				update:  slime.jsh.script.cli.Command<Options>

				/**
				 * For a submodule that is a detached HEAD that is tracking a branch, force the tracked branch to HEAD and check
				 * out the tracked branch.
				 *
				 * `--path <path-to-submodule>`
				 */
				attach: slime.jsh.script.cli.Command<Options & {
					path: string
				}>

				/**
				 * Resets a submodule of this module to point at the current commit for that submodule, and if there is a tracking
				 * branch, resets the tracking branch to that commit.
				 */
				reset:  slime.jsh.script.cli.Command<Options>
			}

			documentation:  slime.jsh.script.cli.Command<Options>

			/**
			 * Intended to support interactively writing documentation; executes `fifty view` with the `--watch` option enabled.
			 * **This process is currently very inefficient; it re-generates the project documentation for each request for a
			 * `.html` URL.**
			 */
			document:  slime.jsh.script.cli.Command<Options>

			git: {
				hooks: {
					"pre-commit"?: slime.jsh.script.cli.Command<Options>
				}
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.interface = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Interface {
			/**
			 * Runs the TypeScript compiler on the project. If the `--vscode` argument is provided, the output will be reformatted
			 * so that references to lines in error messages are clickable.
			 */
			tsc:  slime.jsh.script.cli.Command<Options>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.interface.tsc = function() {
					var repository = test.fixtures.adapt.repository(test.fixtures.project().clone);

					var tscresult = jsh.shell.run({
						command: test.fixtures.wf,
						arguments: ["tsc"],
						directory: repository.directory,
						environment: Object.assign({},
							jsh.shell.environment,
							{ PROJECT: repository.directory.toString() }
						),
						stdio: {
							output: String,
							error: String
						},
						evaluate: function(result) { return result; }
					});
					if (tscresult.status != 0) {
						jsh.shell.console("In: " + repository.directory);
						jsh.shell.console(tscresult.stdio.output + tscresult.stdio.error);
					}
					fifty.verify(tscresult).stdio.evaluate(function(stdio) {
						return stdio.error.indexOf("Passed.") != -1
					}).is(true);

					fifty.run(function tscfail() {
						var repository = test.fixtures.adapt.repository(test.fixtures.project().clone);

						var tsc = function(environment?) {
							var result = jsh.shell.run({
								command: test.fixtures.wf,
								arguments: ["tsc"],
								directory: repository.directory,
								//	TODO	add access to $api.Object in Fifty tests
								environment: Object.assign({},
									jsh.shell.environment,
									{ PROJECT: repository.directory.toString() },
									environment
								),
								stdio: {
									output: String,
									error: String
								},
								evaluate: function(result) { return result; }
							});
							if (result.status != 0) {
								jsh.shell.console(result.stdio.output + "\n" + result.stdio.error);
							}
							return result;
						}

						var before: { status: number, stdio?: any } = tsc();
						fifty.verify(before).status.is(0);

						var wfjs = repository.directory.getFile("wf.js");
						wfjs.pathname.write(
							wfjs.read(String).replace(/\/\/\@ts\-ignore/g, ""),
							{ append: false }
						);

						//	issue 178 (https://github.com/davidpcaldwell/slime/issues/178)
						//	the issue claimed that a stack trace was dumped when tsc failed under nashorn, but there is no stack
						//	trace, as the below output indicates. So hard to assert that there's no stack trace without knowing
						//	what it would look like; disabling output since it is just manually-checked clutter
						var after: { status: number, stdio?: any } = tsc({ JSH_ENGINE: "nashorn" });
						fifty.verify(after).status.is(1);
						if (false) {
							jsh.shell.console("output = [" + after.stdio.output + "]");
							jsh.shell.console("error = [" + after.stdio.error + "]");
						}
					})
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Interface {
			/**
			 * Attempts to commit the current local changes.
			 *
			 * Steps:
			 *
			 * * Check whether up to date with origin.
			 *
			 * * Require that git identity be set.
			 *
			 * * Do not allow untracked files to be present.
			 *
			 * * Ensure linting passes, if linting is defined.
			 *
			 * * Make sure submodules are not modified, if submodules are present.
			 *
			 * * Ensure `tsc` checking passes.
			 *
			 * * Ensure tests pass.
			 *
			 * * Commit
			 *
			 * * Push
			 */
			 commit:  slime.jsh.script.cli.Command<Options>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				fifty.tests.interface.commit = function() {
					var repository = test.fixtures.adapt.repository(test.fixtures.project().clone);

					var environment = {};

					//	add tracked file and wf commit
					repository.directory.getRelativePath("a").write("", { append: false });
					repository.add({ path: "a" });
					var r1: { status: number } = jsh.shell.run({
						command: test.fixtures.wf,
						arguments: ["commit", "--message", "a"],
						environment: Object.assign({},
							jsh.shell.environment,
							{ PROJECT: repository.directory.toString() },
							environment
						),
						directory: repository.directory
					});
					fifty.verify(r1).status.is(0);

					repository.directory.getRelativePath("b").write("", { append: false });
					var result = jsh.shell.run({
						command: test.fixtures.wf,
						arguments: ["commit", "--message", "b"],
						directory: repository.directory,
						stdio: {
							output: String,
							error: String
						},
						environment: Object.assign({},
							jsh.shell.environment,
							{ PROJECT: repository.directory.toString() },
							environment
						),
						evaluate: function(result) { return result; }
					});
					fifty.verify(result).status.is(1);
					fifty.verify(result).stdio.evaluate(function(stdio) {
						jsh.shell.console("error: [" + stdio.error + "]");
						return stdio.error.indexOf("Found untracked files:\nb") != -1;
					}).is(true);
				}

				var addAll: slime.jrunscript.tools.git.Command<void,void> = {
					invocation: function(p) {
						return {
							command: "add",
							arguments: ["."]
						}
					}
				};

				var branch: slime.jrunscript.tools.git.Command<{ name: string, startPoint: string },void> = {
					invocation: function(p) {
						return {
							command: "branch",
							arguments: [p.name, p.startPoint]
						}
					}
				};

				var commit: slime.jrunscript.tools.git.Command<{ message: string }, void> = {
					invocation: function(p) {
						return {
							command: "commit",
							arguments: ["--message", p.message]
						}
					}
				};

				var checkout: slime.jrunscript.tools.git.Command<{ branch: string },void> = {
					invocation: function(p) {
						return {
							command: "checkout",
							arguments: [p.branch]
						}
					}
				};

				var merge: slime.jrunscript.tools.git.Command<{ branch: string },void> = {
					invocation: function(p) {
						return {
							command: "merge",
							arguments: [p.branch]
						}
					}
				};

				var fixtures = {
					git: (
						function() {
							var script: slime.jrunscript.tools.git.test.fixtures.Script = fifty.$loader.script("../../rhino/tools/git/fixtures.ts");
							var setup = script();
							return setup(fifty);
						}
					)(),
					subject: test.fixtures
				};

				fifty.tests.issue485 = function() {
					var project = test.fixtures.project();
					var cloned = test.fixtures.adapt.repository(project.clone);
					var repository = project.clone;
					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							command: repository.location.pathname + "/" + "wf",
							arguments: ["initialize"],
							directory: repository.location.pathname
						}),
						{}
					);
					fixtures.git.edit(repository, "wf.js", function(before) {
						return before + "\n";
					});
					repository.api.command(addAll).argument().run();
					var before = repository.api.command(jsh.tools.git.commands.status).argument().run();
					verify(before).paths["wf.js"].is("M ");
					var success: boolean;
					try {
						repository.api.command(commit).argument({ message: "test" }).run();
						success = true;
					} catch (e) {
						success = false;
					}
					verify(success).is(false);
					var after = repository.api.command(jsh.tools.git.commands.status).argument().run();
					verify(after).paths["wf.js"].is(" M");
				}

				fifty.tests.issue174 = function() {
					var mv: slime.jrunscript.tools.git.Command<{ from: string, to: string },void> = {
						invocation: function(p) {
							return {
								command: "mv",
								arguments: [p.from, p.to]
							}
						}
					};

					var project = fixtures.subject.project().clone;

					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							command: $api.fp.result(project.location, jsh.file.world.Location.relative("wf")).pathname,
							arguments: ["status"]
						}),
						{}
					);

					fixtures.git.edit(project, "new.js", () => "new");
					project.api.command(mv).argument({ from: "a.js", to: "b.js" }).run();

					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							command: $api.fp.result(project.location, jsh.file.world.Location.relative("wf")).pathname,
							arguments: ["status"]
						}),
						{}
					);
				}

				fifty.tests.issue319 = function() {
					var project = test.fixtures.adapt.repository(test.fixtures.project().clone);
					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							command: project.directory.getRelativePath("wf"),
							arguments: $api.Array.build(function(rv) {
								rv.push("commit");
								rv.push("--message", "unchanged");
							})
						})
					);
				};

				fifty.tests.issue332 = function() {
					var x = test.fixtures.project();
					var project = test.fixtures.adapt.repository(x.clone);
					var repository = x.clone;
					fixtures.git.edit(repository, "wf.js", function(before) {
						return before.replace("slime.jsh.Global", "slime.jjj.Global");
					});
					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							command: project.directory.getRelativePath("wf"),
							arguments: $api.Array.build(function(rv) {
								rv.push("commit");
								rv.push("--message", "messed up tsc, hopefully");
							})
						})
					);
				};

				fifty.tests.issue567 = function() {
					var project = test.fixtures.project();
					var origin = project.origin;
					var repository = project.clone;
					repository.api.command(branch).argument({
						name: "feature",
						startPoint: "master"
					}).run();
					repository.api.command(checkout).argument({
						branch: "feature"
					}).run();
					fixtures.git.edit(repository, "f", function(before) {
						return "f";
					});
					repository.api.command(addAll).argument().run();
					repository.api.command(commit).argument({
						message: "f"
					}).run();

					fixtures.git.edit(origin, "m", function(before) {
						return "m";
					});
					origin.api.command(addAll).argument().run();
					origin.api.command(commit).argument({
						message: "m"
					}).run();

					repository.api.command(jsh.tools.git.commands.fetch).argument().run();
					repository.api.command(merge).argument({
						branch: "origin/master"
					}).run();
					jsh.shell.console("Repository location:");
					jsh.shell.console(repository.location.pathname);
				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				fifty.tests.suite = function() {
					fifty.run(fifty.tests.interface);
				}

				fifty.tests.manual = {};
				fifty.tests.manual.fixture = function() {
					var project = test.fixtures.test.fixture();
					jsh.shell.console("cd " + project.directory);
				}
				fifty.tests.manual.profile = function() {
					var project = test.fixtures.adapt.repository(test.fixtures.project({ noInitialize: true }).clone);;
					var getSlimePath = function(relative) {
						return jsh.file.world.spi.filesystems.os.pathname(project.directory.toString()).relative("slime").relative(relative);
					}
					//	TODO	should profiler install Rhino?
					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							command: getSlimePath("jsh.bash").pathname,
							arguments: $api.Array.build(function(rv) {
								rv.push(getSlimePath("jsh/tools/install/rhino.jsh.js").pathname);
							}),
							directory: getSlimePath(".").pathname
						})
					);
					//	Needed for profile viewer, to serve UI and JSON data
					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							command: getSlimePath("jsh.bash").pathname,
							arguments: $api.Array.build(function(rv) {
								rv.push(getSlimePath("jsh/tools/install/tomcat.jsh.js").pathname);
							}),
							directory: getSlimePath(".").pathname
						})
					);
					$api.fp.world.now.action(
						jsh.shell.world.action,
						jsh.shell.Invocation.create({
							//	TODO	perhaps should accept world Pathname
							command: getSlimePath("jsh.bash").pathname,
							arguments: $api.Array.build(function(rv) {
								rv.push(getSlimePath("jsh/tools/profile.jsh.js").pathname);
								rv.push("--profiler:output:json", getSlimePath("local/wf/profile.json").pathname);
								rv.push(getSlimePath("tools/wf.jsh.js").pathname);
								rv.push("initialize");
								rv.push("--test-skip-git-identity-requirement");
							}),
							directory: getSlimePath(".").pathname
						})
					);
				}
			}
		//@ts-ignore
		)(fifty);
	}
}
