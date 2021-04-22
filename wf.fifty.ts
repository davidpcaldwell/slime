namespace slime {
	export namespace project.wf {
		namespace test {
			export const fixtures = (function(fifty: slime.fifty.test.kit) {
				const jsh = fifty.global.jsh;
				return {
					clone: function() {
						//	we want our own local modifications to be present, so we copy over everything except local/
						var location = fifty.jsh.file.location();
						var src : slime.jrunscript.file.Directory = fifty.$loader.getRelativePath(".").directory;
						src.copy(location, {
							filter: function(p) {
								if (p.entry.path.substring(0,"local/".length) == "local/") return false;
								return true;
							}
						});
						var rv = jsh.tools.git.Repository({ directory: location.directory });
						function unset(repository,setting) {
							jsh.shell.run({
								command: "git",
								arguments: ["config", "--local", "--unset", setting],
								directory: repository.directory
							});
						}
						unset(rv, "user.name");
						unset(rv, "user.email");
						return rv;
						//	Was git implementation but did not include local modifications; could use this form if no local modifications
						//	Could also do this and *then* copy modifications outside local/ and git/
						// var origin = new jsh.tools.git.Repository({ directory: fifty.$loader.getRelativePath(".").directory });
						// var rv = origin.clone({ to: fifty.jsh.file.location() });
						// return rv;
					},
					configure: function(repository: slime.jrunscript.git.Repository.Local) {
						repository.config({ set: { name: "user.name", value: "foo" }});
						repository.config({ set: { name: "user.email", value: "bar@example.com" }});
					},
					wf: function(repository: slime.jrunscript.git.Repository.Local, p: any): { status: number, stdio: { output: string, error: string }} {
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
					fifty.run(function() {
						var fresh = test.fixtures.clone();
						test.fixtures.configure(fresh);
						test.fixtures.wf(fresh, {
							arguments: ["initialize"]
						});
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