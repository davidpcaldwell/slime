//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf {
	export namespace standard {
		namespace test {
			export const fixtures = (
				function(fifty: slime.fifty.test.kit) {
					const jsh = fifty.global.jsh;

					function configure(repository: slime.jrunscript.git.Repository.Local) {
						repository.config({ set: { name: "user.name", value: "foo" }});
						repository.config({ set: { name: "user.email", value: "bar@example.com" }});
					}

					var src: slime.jrunscript.file.Directory = fifty.$loader.getRelativePath("../..").directory;

					function fixture() {
						var project = fifty.jsh.file.location();
						fifty.$loader.getRelativePath("test/data/plugin-standard").directory.copy(project);
						var repository = jsh.tools.git.init({
							pathname: project
						});
						configure(repository);
						repository.config({
							set: {
								name: "receive.denyCurrentBranch",
								value: "warn"
							}
						});
						repository.add({
							path: "."
						});
						var slime = jsh.tools.git.Repository({
							directory: src
						});
						//	TODO	Note that this adds committed version of SLIME (or something), rather than local version. May not work
						//			as expected. May want to overwrite (so that submodule config is preserved) with a local copy
						//			that excludes local/
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
						wf: fifty.$loader.getRelativePath("../wf.bash").file,
						project: function() {
							var origin = fixture();
							var repository = origin.clone({
								to: fifty.jsh.file.location()
							});
							repository.submodule.update({
								init: true
							});
							configure(repository);
							//	copy local modifications to source tree since we are testing this source code
							src.copy(repository.directory.getRelativePath("slime"), {
								filter: function(item) {
									if (item.entry.path.substring(0,"local/".length) == "local/") return false;
									if (item.entry.path == ".git") return false;
									if (item.entry.path.substring(0,".git/".length) == ".git/") return false;
									//jsh.shell.console("conflict: " + item.entry.path);
									//	If we have a file in the way of a directory, remove it
									if (item.exists && !item.exists.directory && item.entry.node.directory) {
										item.exists.remove();
										return true;
									}
									return true;
								}
							});
							var cloned = repository.directory.getSubdirectory("slime").list({
								type: repository.directory.list.ENTRY,
								filter: function(node) {
									return !node.directory;
								},
								descendants: function(directory) {
									return directory.pathname.basename != ".git" && directory.pathname.basename != "local";
								}
							});
							cloned.forEach(function(entry) {
								var deleted = !src.getFile(entry.path);
								if (deleted) {
									if (entry.path != ".git") {
										jsh.shell.console("Deleting cloned file deleted locally: " + entry.path);
										repository.directory.getSubdirectory("slime").getFile(entry.path).remove();
									}
								}
							});
							var slime = jsh.tools.git.Repository({ directory: repository.directory.getSubdirectory("slime") });
							if (slime.status().paths) {
								slime.add({ path: "." });
								slime.commit({ message: "Local modifications committed by plugin-standard.jsh.fifty.ts tests." });
							}

							//	Initialize SLIME external types (e.g., jsyaml) so that tsc will pass
							jsh.shell.run({
								command: slime.directory.getFile("wf"),
								arguments: ["initialize", "--test-skip-git-identity-requirement"]
							});

							return repository;
						}
					}
				}
			//@ts-ignore
			)(fifty);
		}
		export interface Project {
			lint?: () => boolean
			test?: () => boolean
			commit?: (p: {
				message: string
				notest?: boolean
			}) => void
		}

		export type Options = {};

		/**
		 * Implements the standard `wf` commands provided by {@link slime.jsh.wf.Exports | `jsh.wf.project.initialize()`}.
		 */
		export interface Interface {
			eslint:  slime.jsh.script.cli.Command<Options>

			lint?: slime.jsh.script.cli.Command<Options>

			/**
			 * Runs the Typedoc documentation generator.
			 */
			typedoc:  slime.jsh.script.cli.Command<Options>

			status:  slime.jsh.script.cli.Command<Options>

			test:  slime.jsh.script.cli.Command<Options>

			submodule: {
				/**
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
				attach: slime.jsh.script.cli.Command<Options>

				reset:  slime.jsh.script.cli.Command<Options>
			}

			documentation:  slime.jsh.script.cli.Command<Options>
			document:  slime.jsh.script.cli.Command<Options>
		}

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				fifty.tests.interface = {};
			}
		//@ts-ignore
		)(fifty);

		export interface Interface {
			/**
			 * Runs the TypeScript compiler on the project.
			 */
			 tsc:  slime.jsh.script.cli.Command<Options>
		}

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.interface.tsc = function() {
					var repository = test.fixtures.project();

					var tscresult: { status: number, stdio: any } = jsh.shell.run({
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

					run(function tscfail() {
						var repository = test.fixtures.project();

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

						var before: { status: number, stdio: any } = tsc();
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
						var after: { status: number, stdio: any } = tsc({ JSH_ENGINE: "nashorn" });
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
				fifty: slime.fifty.test.kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.interface.commit = function() {
					var repository = test.fixtures.project();
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
					var result: { status: number, stdio: any } = jsh.shell.run({
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
						return stdio.error.indexOf("Found untracked files:\nb") != -1;
					}).is(true);
				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				fifty.tests.suite = function() {
					fifty.run(fifty.tests.interface.tsc);
					fifty.run(fifty.tests.interface.commit);
				}
			}
		//@ts-ignore
		)(fifty);

	}
}