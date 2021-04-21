namespace slime {
	export namespace project.wf {
		export interface Interface extends slime.jsh.wf.standard.Interface {
			/**
			 * If this project is operating as an Eclipse project (including VSCode), ensures that project-specified Eclipse settings
			 * are provided.
			 */
			initialize: slime.jsh.wf.cli.Interface["initialize"]

			vscode: {
				java: {
					/**
					 * Removes the VSCode extension information about the project and explains how to regenerate it.
					 */
					refresh: slime.jsh.wf.cli.Command
				}
			}

			git: {
				branches: {
					clean: slime.jsh.wf.cli.Command
					list: slime.jsh.wf.cli.Command
				}
			}

			merge: slime.jsh.wf.cli.Command

			docker: {
				test: slime.jsh.wf.cli.Command
			}
		}
	}
}