//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.standard {
	export interface Context {
		library: {
			git: slime.jrunscript.tools.git.Exports
			file: slime.jrunscript.file.Exports
		}

		jsh: {
			shell: slime.jsh.shell.Exports
			script: slime.jsh.script.Exports
		}

		api: {
			checks: slime.$api.fp.impure.Input<slime.jsh.wf.Exports["checks"]>
			project: slime.$api.fp.impure.Input<{
				updateSubmodule: slime.jsh.wf.Exports["project"]["updateSubmodule"]
				submodule: Pick<slime.jsh.wf.Exports["project"]["submodule"],"remove"|"status"|"attach">
				lint: {
					eslint: slime.jsh.wf.Exports["project"]["lint"]["eslint"]
				}
				Submodule: {
					construct: slime.jsh.wf.Exports["project"]["Submodule"]["construct"]
				}
			}>
			git: slime.$api.fp.impure.Input<slime.jsh.wf.Exports["git"]>
			typescript: slime.$api.fp.impure.Input<{
				typedoc: {
					now: slime.jsh.wf.Exports["typescript"]["typedoc"]["now"]
				}
			}>
		}
	}

	namespace test {
		export interface Fixtures {
			git: {
				standard: ReturnType<slime.jrunscript.tools.git.test.fixtures.Exports>
				local: {
					addAll: slime.jrunscript.tools.git.Command<void,void>
					getCurrentCommit: slime.jrunscript.tools.git.Command<void,string>
				}
			}

			adapt: {
				repository: (from: slime.jrunscript.tools.git.test.fixtures.Repository) => slime.jrunscript.tools.git.repository.Local
			}

			/**
			 * Creates a project based on the project configuration in the `test/data/plugin-standard/` directory,
			 * with user.name and user.email configured, and adds a `slime` subrepository to it at `slime/`.
			 *
			 * @returns The repository for the new project.
			 */
			local: () => slime.jrunscript.tools.git.repository.Local

			/**
			 * Initializes a `git` repository using the code at `test/data/plugin-standard/`, adding a `slime/` subrepository,
			 * and then clones it (and initializes it by updating the `slime` submodule and optionally running `wf initialize`),
			 * returning both the original ("origin") repository and the cloned repository, enabling tests to be run that
			 * involve `git` remotes.
			 *
			 * @param p Specifies whether to skip running `wf initialize` on the project.
			 */
			hosted: (p?: { noInitialize?: boolean }) => {
				origin: slime.jrunscript.tools.git.test.fixtures.Repository
				clone: slime.jrunscript.tools.git.test.fixtures.Repository
			}

			wf: slime.jrunscript.file.File
			jsh: slime.jrunscript.file.File
		}

		export const fixtures: Fixtures = (
			function(fifty: slime.fifty.test.Kit) {
				const jsh = fifty.global.jsh;

				const fixtures = (
					function() {
						var script: slime.jsh.wf.test.Script = fifty.$loader.script("../../tools/wf/test/fixtures.ts");
						return script()(fifty);
					}
				)();

				var src: slime.jrunscript.file.Directory = fifty.jsh.file.object.getRelativePath("../..").directory;

				var getCurrentBranch = function() {
					return jsh.tools.git.program({ command: "git" })
						.repository(src.toString())
						.command(jsh.tools.git.commands.status)
						.argument()
						.run()
						.branch
					;
				}

				/**
				 * Creates a repository based on the `test/data/plugin-standard` directory that has `slime` as a submodule.
				 */
				function fixture() {
					var project = fifty.jsh.file.object.temporary.location();
					fifty.jsh.file.object.getRelativePath("test/data/plugin-standard").directory.copy(project);

					//	Add a sample file to the fixture
					project.directory.getRelativePath("a.js").write("", { append: false });

					var repository = jsh.tools.git.oo.init({
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
					jsh.shell.console("'Cloning' slime from " + src.pathname + " ...");
					var slime = fixtures.clone({
						src: jsh.file.world.filesystems.os.pathname(src.toString()),
						commit: {
							message: "Local modifications"
						}
					});
					var branch = getCurrentBranch();
					jsh.shell.console("slime = " + slime.directory.pathname);
					fixtures.configure(slime);
					var slime = repository.submodule.add({
						repository: slime,
						path: "slime",
						branch: branch,
						config: {
							//	See https://vielmetti.typepad.com/logbook/2022/10/git-security-fixes-lead-to-fatal-transport-file-not-allowed-error-in-ci-systems-cve-2022-39253.html
							"protocol.file.allow": "always"
						}
					});
					//	TODO	it would be nice to set submodule.slime.udpate=merge, but hopefully not strictly necessary right
					//			now
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

				var git = (
					function() {
						var script: slime.jrunscript.tools.git.test.fixtures.Script = fifty.$loader.script("../../rhino/tools/git/fixtures.ts");
						var setup = script();
						return setup(fifty);
					}
				)();

				return {
					git: {
						standard: git,
						local: {
							addAll: {
								invocation: function(p) {
									return {
										command: "add",
										arguments: ["."]
									}
								}
							},
							getCurrentCommit: {
								invocation: function(p) {
									return {
										command: "rev-parse",
										arguments: [
											"--verify",
											"HEAD"
										]
									};
								},
								result: function(output) {
									return output.split("\n")[0];
								}
							}
						}
					},
					jsh: fifty.jsh.file.object.getRelativePath("../../jsh.bash").file,
					/**
					 * The `wf.bash` program for the current SLIME shell under test.
					 */
					wf: fifty.jsh.file.object.getRelativePath("../wf.bash").file,
					local: fixture,
					hosted: function project(p?: { noInitialize?: boolean }) {
						if (!p) p = {};
						var origin = fixture();
						jsh.shell.console("origin = " + origin.directory.pathname);
						var clone = fixtures.clone({
							src: jsh.file.world.filesystems.os.pathname(origin.directory.toString())
						});
						clone.submodule.update({
							init: true,
							config: {
								//	See https://vielmetti.typepad.com/logbook/2022/10/git-security-fixes-lead-to-fatal-transport-file-not-allowed-error-in-ci-systems-cve-2022-39253.html
								"protocol.file.allow": "always"
							}
						});
						fixtures.configure(clone);

						if (!clone.directory.getSubdirectory("slime")) throw new Error("Could not update slime submodule in " + clone.directory.pathname.toString());
						var slime = jsh.tools.git.oo.Repository({ directory: clone.directory.getSubdirectory("slime") });
						slime.checkout({ branch: "origin/" + getCurrentBranch() });
						fixtures.configure(slime);

						//	Initialize SLIME external types (e.g., jsyaml) so that tsc will pass
						if (!p.noInitialize) (
							function wfInitialize() {
								jsh.shell.run({
									command: clone.directory.getFile("wf"),
									arguments: ["initialize"]
								});
							}
						)();

						function toGitFixturesRepository(p: slime.jrunscript.tools.git.repository.Local): slime.jrunscript.tools.git.test.fixtures.Repository {
							return git.Repository.from.location( p.directory.pathname.os.adapt() )
						}

						return {
							origin: toGitFixturesRepository(origin),
							clone: toGitFixturesRepository(clone)
						};
					},
					adapt: {
						repository: function(repository: slime.jrunscript.tools.git.test.fixtures.Repository): slime.jrunscript.tools.git.repository.Local {
							return jsh.tools.git.oo.Repository({ directory: jsh.file.Pathname(repository.location).directory });
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
			var { $api, jsh } = fifty.global;

			fifty.tests.interface.tsc = function() {
				var repository = test.fixtures.adapt.repository(test.fixtures.hosted().clone);

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
					var repository = test.fixtures.adapt.repository(test.fixtures.hosted().clone);

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

					var engines = JSON.parse($api.fp.world.now.question(
						jsh.shell.world.question,
						jsh.shell.Invocation.from.argument({
							command: "bash",
							arguments: [test.fixtures.jsh.toString(), "-engines"],
							stdio: {
								output: "string"
							}
						})
					).stdio.output);

					//	issue 178 (https://github.com/davidpcaldwell/slime/issues/178)
					//	the issue claimed that a stack trace was dumped when tsc failed under nashorn, but there is no stack
					//	trace, as the below output indicates. So hard to assert that there's no stack trace without knowing
					//	what it would look like; disabling output since it is just manually-checked clutter
					if (engines.indexOf("nashorn") != -1) {
						var after: { status: number, stdio?: any } = tsc({ JSH_ENGINE: "nashorn" });
						fifty.verify(after).status.is(1);
						if (false) {
							jsh.shell.console("output = [" + after.stdio.output + "]");
							jsh.shell.console("error = [" + after.stdio.error + "]");
						}
					} else {
						jsh.shell.console("Nashorn not present; skipping Nashorn-specific test case.");
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
				var repository = test.fixtures.adapt.repository(test.fixtures.hosted().clone);

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
		}
	//@ts-ignore
	)(fifty);

	export interface Interface {
		submodule: {
			/**
			 * Completely removes a top-level submodule from the project.
			 *
			 * `--path <path-to-submodule>`
			 */
			remove: slime.jsh.script.cli.Command<Options & {
				path: string
			}>

			/**
			 * `--path <path-to-submodule>`
			 */
			update: slime.jsh.script.cli.Command<Options>

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
			reset:  slime.jsh.script.cli.Command<Options & {
				path: string
			}>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.interface.submodule = fifty.test.Parent();

			fifty.tests.interface.submodule.reset = function() {
				var createSlimeBranch: slime.jrunscript.tools.git.Command<{ name: string },void> = {
					invocation: function(p) {
						return {
							command: "checkout",
							arguments: [
								"-b",
								p.name
							]
						}
					}
				};

				var it = test.fixtures.hosted().clone;
				var slime = test.fixtures.git.standard.submodule(it, "slime");

				var branch = jsh.tools.git.program({ command: "git" })
					.repository(fifty.jsh.file.relative("../..").pathname)
					.command(jsh.tools.git.commands.status)
					.argument()
					.run()
					.branch
				;

				var before = {
					commit: slime.api.command(test.fixtures.git.local.getCurrentCommit).argument().run()
				};

				slime.api.command(createSlimeBranch).argument({ name: "submodule-reset" }).run();
				test.fixtures.git.standard.edit(slime, "wf.js", code => code + "\n" + "//foo\n");
				jsh.shell.console("Committing ...");
				slime.api.command(test.fixtures.git.local.addAll).argument().run();
				slime.api.command(test.fixtures.git.standard.commands.commit).argument({ message: "advance submodule" }).run({
					stdout: function(line) {
						jsh.shell.console("STDOUT: " + line);
					},
					stderr: function(line) {
						jsh.shell.console("STDERR: " + line);
					}
				});

				var after = slime.api.command(test.fixtures.git.local.getCurrentCommit).argument().run();

				verify(after).is.not(before.commit);

				jsh.shell.console("Running wf submodule.reset ...");
				$api.fp.world.now.action(
					jsh.shell.subprocess.action,
					{
						command: jsh.file.world.Location.relative("wf")(jsh.file.world.Location.from.os(it.location)).pathname,
						arguments: [
							"submodule.reset",
							"--path", "slime"
						]
					}
				)
				jsh.shell.console("Ran wf submodule.reset.");

				var afterResetCommit = slime.api.command(test.fixtures.git.local.getCurrentCommit).argument().run();
				var afterResetBranch = slime.api.command(jsh.tools.git.commands.status).argument().run();

				verify(afterResetBranch).branch.is(branch);
				verify(afterResetCommit).is(before.commit);

				jsh.shell.console("cd " + it.location);
			};
		}
	//@ts-ignore
	)(fifty);

	export type Export = (
		$context: jsh.wf.cli.Context,
		operations: standard.Project,
		$exports: standard.Interface
	) => void;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.interface);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Export>;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.local = function() {
				var project = test.fixtures.local();
				jsh.shell.console("cd " + project.directory);
			};

			fifty.tests.manual.hosted = function() {
				var project = test.fixtures.hosted();
				jsh.shell.console("cd " + project.clone.location);
			}

			fifty.tests.manual.profile = function() {
				var project = test.fixtures.adapt.repository(test.fixtures.hosted({ noInitialize: true }).clone);;
				var getSlimePath = function(relative) {
					return jsh.file.world.filesystems.os.pathname(project.directory.toString()).relative("slime").relative(relative);
				}
				//	TODO	should profiler install Rhino?
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: getSlimePath("jsh").pathname,
						arguments: $api.Array.build(function(rv) {
							rv.push(getSlimePath("jsh/tools/install/rhino.jsh.js").pathname);
						}),
						directory: getSlimePath(".").pathname
					})
				);
				//	Needed for profile viewer, to serve UI and JSON data
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: getSlimePath("jsh").pathname,
						arguments: $api.Array.build(function(rv) {
							rv.push(getSlimePath("jsh/tools/install/tomcat.jsh.js").pathname);
						}),
						directory: getSlimePath(".").pathname
					})
				);
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						//	TODO	perhaps should accept world Pathname
						command: getSlimePath("jsh").pathname,
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

			var addAll: slime.jrunscript.tools.git.Command<void,void> = test.fixtures.git.local.addAll;

			var branch: slime.jrunscript.tools.git.Command<{ name: string, startPoint: string },void> = {
				invocation: function(p) {
					return {
						command: "branch",
						arguments: [p.name, p.startPoint]
					}
				}
			};

			var commit: slime.jrunscript.tools.git.Command<{ message: string }, void> = test.fixtures.git.standard.commands.commit;

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

			fifty.tests.manual.issue485 = function() {
				var project = test.fixtures.hosted();
				var cloned = test.fixtures.adapt.repository(project.clone);
				var repository = project.clone;
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: repository.location + "/" + "wf",
						arguments: ["initialize"],
						directory: repository.location
					}),
					{}
				);
				test.fixtures.git.standard.edit(repository, "wf.js", function(before) {
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

			fifty.tests.manual.issue174 = function() {
				var mv: slime.jrunscript.tools.git.Command<{ from: string, to: string },void> = {
					invocation: function(p) {
						return {
							command: "mv",
							arguments: [p.from, p.to]
						}
					}
				};

				var project = test.fixtures.hosted().clone;

				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: $api.fp.result(project.location, jsh.file.world.Location.from.os, jsh.file.world.Location.relative("wf")).pathname,
						arguments: ["status"]
					}),
					{}
				);

				test.fixtures.git.standard.edit(project, "new.js", () => "new");
				project.api.command(mv).argument({ from: "a.js", to: "b.js" }).run();

				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: $api.fp.result(project.location, jsh.file.world.Location.from.os, jsh.file.world.Location.relative("wf")).pathname,
						arguments: ["status"]
					}),
					{}
				);
			}

			fifty.tests.manual.issue319 = function() {
				var project = test.fixtures.adapt.repository(test.fixtures.hosted().clone);
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: project.directory.getRelativePath("wf").toString(),
						arguments: $api.Array.build(function(rv) {
							rv.push("commit");
							rv.push("--message", "unchanged");
						})
					})
				);
			};

			fifty.tests.manual.issue332 = function() {
				var x = test.fixtures.hosted();
				var project = test.fixtures.adapt.repository(x.clone);
				var repository = x.clone;
				test.fixtures.git.standard.edit(repository, "wf.js", function(before) {
					return before.replace("slime.jsh.Global", "slime.jjj.Global");
				});
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: project.directory.getRelativePath("wf").toString(),
						arguments: $api.Array.build(function(rv) {
							rv.push("commit");
							rv.push("--message", "messed up tsc, hopefully");
						})
					})
				);
			};

			fifty.tests.manual.issue567 = function() {
				var project = test.fixtures.hosted();
				var origin = project.origin;
				var repository = project.clone;
				repository.api.command(branch).argument({
					name: "feature",
					startPoint: "master"
				}).run();
				repository.api.command(checkout).argument({
					branch: "feature"
				}).run();
				test.fixtures.git.standard.edit(repository, "f", function(before) {
					return "f";
				});
				repository.api.command(addAll).argument().run();
				repository.api.command(commit).argument({
					message: "f"
				}).run();

				test.fixtures.git.standard.edit(origin, "m", function(before) {
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
				jsh.shell.console(repository.location);
			}
		}
	//@ts-ignore
	)(fifty);
}
