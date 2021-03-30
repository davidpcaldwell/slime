namespace slime.jsh.wf {
	export namespace standard {
		export interface Project {
			lint?: () => boolean
			test?: () => boolean
			commit?: (p: { message: string }) => void
		}

		export interface Interface {
			status: jsh.wf.cli.Command

			/**
			 * Runs the TypeScript compiler on the project.
			 */
			tsc: jsh.wf.cli.Command

			/**
			 * Runs the Typedoc documentation generator.
			 */
			typedoc: jsh.wf.cli.Command

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
			},
			commit: jsh.wf.cli.Command

			documentation: jsh.wf.cli.Command
			document: jsh.wf.cli.Command
		}
	}
}