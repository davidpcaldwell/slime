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
	}
}