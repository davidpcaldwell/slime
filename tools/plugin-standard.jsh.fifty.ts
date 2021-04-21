namespace slime.jsh.wf {
	export namespace standard {
		export interface Project {
			lint?: () => boolean
			test?: () => boolean
			commit?: (p: { message: string }) => void
		}

		/**
		 * Implements the standard `wf` commands provided by `jsh.wf.cli.initialize()`.
		 */
		export interface Interface {
			eslint: jsh.wf.cli.Command

			/**
			 * Runs the TypeScript compiler on the project.
			 */
			tsc: jsh.wf.cli.Command

			/**
			 * Runs the Typedoc documentation generator.
			 */
			typedoc: jsh.wf.cli.Command

			status: jsh.wf.cli.Command

			test: jsh.wf.cli.Command

			submodule: {
				/**
				 * `--path <path-to-submodule>`
				 */
				remove: jsh.wf.cli.Command
				/**
				 * `--path <path-to-submodule>`
				 */
				update: jsh.wf.cli.Command
				reset: jsh.wf.cli.Command
			}

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
			commit: jsh.wf.cli.Command

			documentation: jsh.wf.cli.Command
			document: jsh.wf.cli.Command
		}

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.suite = function() {
					var wf = fifty.$loader.getRelativePath("wf").file;

					function configure(repository: slime.jrunscript.git.Repository.Local) {
						repository.config({ set: { name: "user.name", value: "foo" }});
						repository.config({ set: { name: "user.email", value: "bar@example.com" }});
					}

					function fixture() {
						var project = fifty.jsh.file.location();
						fifty.$loader.getRelativePath("test/data/plugin-standard").directory.copy(project);
						jsh.shell.console(project.toString());
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
							directory: fifty.$loader.getRelativePath("..").directory
						});
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

					var origin = fixture();
					var repository = origin.clone({
						to: fifty.jsh.file.location()
					});
					repository.submodule.update({
						init: true
					});
					configure(repository);

					//	add tracked file and wf commit
					repository.directory.getRelativePath("a").write("", { append: false });
					repository.add({ path: "a" });
					var r1: { status: number } = jsh.shell.run({
						command: wf,
						arguments: ["commit", "--message", "a"],
						directory: repository.directory
					});
					fifty.verify(r1).status.is(0);

					repository.directory.getRelativePath("b").write("", { append: false });
					var result: { status: number, stdio: any } = jsh.shell.run({
						command: wf,
						arguments: ["commit", "--message", "b"],
						directory: repository.directory,
						stdio: {
							output: String,
							error: String
						},
						evaluate: function(result) { return result; }
					});
					fifty.verify(result).status.is(1);
					fifty.verify(result).stdio.evaluate(function(stdio) {
						return stdio.error.indexOf("Found untracked files: b") != -1;
					}).is(true);
				}
			}
		//@ts-ignore
		)(fifty);

	}
}