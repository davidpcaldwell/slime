namespace slime {
	export namespace project.wf {
		namespace test {
			export const fixtures = (function(fifty: slime.fifty.test.kit) {
				const jsh = fifty.global.jsh;
				return {
					clone: function() {
						var origin = new jsh.tools.git.Repository({ directory: fifty.$loader.getRelativePath(".").directory });
						var rv = origin.clone({ to: fifty.jsh.file.location() });
						return rv;
					},
					wf: function(repository: slime.jrunscript.git.Repository.Local, p: any) {
						jsh.shell.run({
							command: repository.directory.getFile("wf"),
							arguments: p.arguments,
							environment: Object.assign({}, jsh.shell.environment, {
								JSH_USER_JDKS: "/dev/null"
							})
						});
					}
				};
			//@ts-ignore
			})(fifty)
		}
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

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.suite = function() {
					var fresh = test.fixtures.clone();
					test.fixtures.wf(fresh, {
						arguments: ["initialize"]
					});
					jsh.shell.console(fresh.directory.toString());
					fifty.verify(fresh).directory.getSubdirectory("local/jsh/lib/node/lib/node_modules/eslint").is.type("object");
					fifty.verify(fresh).directory.getSubdirectory("local/jsh/lib/node/lib/node_modules/foo").is.type("null");
				}
			}
		//@ts-ignore
		)(fifty);

	}
}