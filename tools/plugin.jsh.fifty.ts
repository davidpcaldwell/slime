namespace slime.jsh {
	export interface Global {
		wf: slime.jsh.wf.Exports
	}
}

//	TODO	"ordinary SLIME module" below may not be really documented
/**
 * The SLIME tool for implementing project tasks related to the software development life cycle.
 *
 * SLIME provides the `tools/wf` bash script which can be used by projects to execute `wf` commands. The script relies
 * on the project directory containing a `wf.js` file, which is used to define the implementation of the commands.
 *
 * The `tools/wf` script expects the project to define the `PROJECT` environment variable to point to the root of the project.
 * Otherwise, it will try to use the working directory as the project root.
 *
 * So, a typical `wf` script for a project might look like this:
 * ```bash
 * #!/bin/bash
 * export PROJECT="$(dirname $0)"
 * ${PROJECT}/[<i>path/to/slime</i>]/tools/wf "$@"
 * ```
 *
 * The `wf.js` file should be an ordinary SLIME module, which will be loaded with a `$context` providing a project
 * {@link slime.jsh.wf.cli.Context}. Each function `wf.js` exports
 * will be interpreted as a command which can be executed by name, and will receive an argument specified by
 * {@link jsh.wf.cli.Arguments}. Commands can use the {@link slime.jsh.wf.Exports | jsh.wf} APIs
 * as part of their implementation.
 *
 * In particular, `jsh.wf` provides the
 * {@link slime.jsh.wf.Exports | project.initialize} method that
 * enables authors to provide a {@link slime.jsh.wf.standard.Interface | standard set} of `wf` commands given a
 * {@link slime.jsh.wf.standard.Project | Project} definition that provides implementations for a few basic operations.
 *
 * If a project provides an `initialize` command, it is executed prior to every `wf` command (and should thus be idempotent).
 */
namespace slime.jsh.wf {
	/**
	 * An object that, given a Git repository, can provide the Git user.name and user.email values for that repository (perhaps
	 * by prompting the user).
	 */
	interface GitIdentityProvider {
		name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
		email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
	}

	export namespace cli {
		export interface Context {
			/** The project directory. */
			base: slime.jrunscript.file.Directory
		}

		export interface CommandInvocation extends jsh.script.Invocation<any> {
			command: string
		}

		export interface Command {
			(p: jsh.script.Invocation<any>): void
		}

		export interface Commands {
			[x: string]: ( Command | Commands )
		}

		export interface Interface extends Commands {
			/**
			 * A special {@link Command} that is run each time any (other) `Command` is run.
			 */
			 initialize?: Command
		}

		export type Processor = (p: jsh.script.Invocation<any>) => jsh.script.Invocation<any>

		export namespace error {
			export interface TargetNotFound extends Error {
				command: string
			}

			export interface TargetNotFunction extends Error {
				command: string
				target: any
			}
		}
	}

	/**
	 * The `project.initialize` function provides a default `wf` implementation for projects with a number of standard commands; it
	 * requires project-level specification of operations like `commit`, `lint`, and/or `test`.
	 */
	export interface Exports {
		project: {
			base: slime.jrunscript.file.Directory

			submodule: {
				status: () => Array<slime.jrunscript.git.Submodule & {
					status: ReturnType<slime.jrunscript.git.Repository.Local["status"]>
					state: ReturnType<ReturnType<Exports["git"]["compareTo"]>>
				}>
				remove: (p: { path: string }) => void
			}

			updateSubmodule: (p: { path: string }) => void

			/**
			 * Given an {@link standard.Project} defining a few simple operations, initializes the given `$exports` object
			 * with a standard set of `wf` commands defined by {@link standard.Interface}.
			 */
			initialize: {
				(
					$context: jsh.wf.cli.Context,
					operations: standard.Project,
					$exports: standard.Interface
				): void
			}
		}

		cli: {
			error: {
				TargetNotFound: $api.Error.Type<cli.error.TargetNotFound>
				TargetNotFunction: $api.Error.Type<cli.error.TargetNotFunction>
			}
			$f: {
				command: {
					/**
					 * Converts a set of arguments whose first argument describes a command to an invocation that indicates
					 * that command and includes the remaining arguments.
					 */
					parse: (p: jsh.script.Invocation<any>) => cli.CommandInvocation

					/**
					 * @throws { cli.error.TargetNotFound } if the specified target is not found on the interface
					 * @throws { cli.error.TargetNotFunction } if the specified target is not a function
					 */
					target: (p: { interface: cli.Interface, target: string }) => cli.Command

					process: (p: { interface: cli.Interface, invocation: cli.CommandInvocation }) => void

					/**
					 * Executes a command, derived from the first available argument, on the given interface with the remaining
					 * arguments following the command.
					 */
					execute: (p: { interface: cli.Interface, arguments: jsh.script.Invocation<any> }) => void
				}
				option: {
					string: (c: { longname: string }) => cli.Processor
					boolean: (c: { longname: string }) => cli.Processor
					number: (c: { longname: string }) => cli.Processor
					pathname: (c: { longname: string }) => cli.Processor
				},
				/**
				 * Returns an object representing the global invocation of `jsh`.
				 */
				invocation: <T>(
					f: (p: jsh.script.Invocation<any>) => T
				) => T
			}

			/**
			 * Provides an imperative way to process the arguments of a script. The function takes an array of argument
			 * revisers and returns the result of processing `jsh.script.arguments` through the revisers.
			 */
			invocation: {
				(mutator: cli.Processor, m2: cli.Processor, m3: cli.Processor, m4: cli.Processor): jsh.script.Invocation<any>
				(mutator: cli.Processor, m2: cli.Processor, m3: cli.Processor): jsh.script.Invocation<any>
				(mutator: cli.Processor, m2: cli.Processor): jsh.script.Invocation<any>
				(mutator: cli.Processor): jsh.script.Invocation<any>
			}

			/** @deprecated Replaced by jsh.wf.project.initialize(). */
			initialize: {
				(
					$context: jsh.wf.cli.Context,
					operations: standard.Project,
					$exports: standard.Interface
				): void
			}
		}

		git: {
			compareTo: (branchName: string) =>
				(repository: slime.jrunscript.git.Repository.Local) => {
					ahead: slime.jrunscript.git.Commit[],
					behind: slime.jrunscript.git.Commit[],
					paths: any
				}
		}

		typescript: {
			/**
			 * Ensures that Node.js is installed and that the project-appropriate version of TypeScript is present.
			 */
			require: (p?: { project: slime.jrunscript.file.Directory }) => void
			tsc: (p?: { project: slime.jrunscript.file.Directory }) => void
			typedoc: (p?: { project: slime.jrunscript.file.Directory }) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.exports = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Errs if files untracked by Git are found in the given repository.
		 */
		 prohibitUntrackedFiles: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void
	}

	(
		function(fifty: slime.fifty.test.kit) {
			fifty.tests.exports.prohibitUntrackedFiles = function() {
				fifty.global.jsh.shell.console("foo");
			}
		}
	//@ts-ignore
	)(fifty)

	export interface Exports {
		/**
		 * Errs if the given repository does not supply Git `user.name` and `user.email`
		 * values. Callers may provide an implementation that obtains the configuration values if they are missing, including a
		 * provided implementation that prompts the user in a GUI dialog.
		 */
		requireGitIdentity: {
			(p: {
				repository: slime.jrunscript.git.Repository.Local
				get?: GitIdentityProvider
			}, events?: $api.Events.Function.Receiver)

			get: {
				gui: GitIdentityProvider
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			fifty.tests.exports.requireGitIdentity = function() {
				run(fifty.tests.exports.requireGitIdentity.first);
				run(fifty.tests.exports.requireGitIdentity.second);
				run(fifty.tests.exports.requireGitIdentity.third);
			};

			fifty.tests.exports.requireGitIdentity.first = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
				jsh.tools.git.init({ pathname: directory.pathname });
				var unconfigured = jsh.tools.git.Repository({ directory: directory });
				//jsh.wf.requireGitIdentity({ repository: unconfigured });
				//	TODO	could we get this working?:
				//	verify(jsh.wf).requireGitIdentity( ... ).threw.type(Error)
				fifty.verify(jsh.wf).evaluate(function() {
					this.requireGitIdentity({ repository: unconfigured });
				}).threw.type(Error);
			}

			fifty.tests.exports.requireGitIdentity.second = function() {
				//	TODO	test callbacks
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
				jsh.tools.git.init({ pathname: directory.pathname });
				var toConfigure = jsh.tools.git.Repository({ directory: directory });
				verify(jsh.wf).evaluate(function() {
					this.requireGitIdentity({
						repository: toConfigure,
						get: {
							name: function(p) {
								return "Marcus Aurelius";
							},
							email: function(p) {
								return "test@example.com";
							}
						}
					});
				}).threw.nothing();
				var config = toConfigure.config({
					arguments: ["--list"]
				}) as { [x: string]: string };
				jsh.shell.console(JSON.stringify(config));
				verify(config)["user.name"].is("Marcus Aurelius");
				verify(config)["user.email"].is("test@example.com");
			}

			fifty.tests.exports.requireGitIdentity.third = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
				jsh.tools.git.init({ pathname: directory.pathname });
				var configured = jsh.tools.git.Repository({ directory: directory });
				configured.config({
					arguments: ["user.name", "foo"]
				});
				configured.config({
					arguments: ["user.email", "bar"]
				});
				verify(jsh.wf).evaluate(function() {
					this.requireGitIdentity({ repository: configured });
				}).threw.nothing();
			}
		}
	//@ts-ignore
	)(fifty)

	export interface Exports {
		prohibitModifiedSubmodules: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			function configure(repository: slime.jrunscript.git.Repository.Local) {
				repository.config({
					set: {
						name: "user.name",
						value: "SLIME"
					}
				});
				repository.config({
					set: {
						name: "user.email",
						value: "slime@example.com"
					}
				});
			}

			fifty.tests.exports.prohibitModifiedSubmodules = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
				jsh.shell.console("directory = " + directory);
				var parent = jsh.tools.git.init({ pathname: directory.pathname });
				configure(parent);
				directory.getRelativePath("a").write("a", { append: false });
				parent.add({ path: "." });
				parent.commit({ all: true, message: "message a" });
				var subdirectory = directory.getRelativePath("sub").createDirectory();
				var child = jsh.tools.git.init({ pathname: subdirectory.pathname });
				configure(child);
				subdirectory.getRelativePath("b").write("b", { append: false });
				child.add({ path: "." });
				child.commit({ all: true, message: "message b" });
				verify(parent).submodule().length.is(0);
				parent.submodule.add({
					repository: child,
					path: "sub"
				});

				var mock = fifty.$loader.jsh.plugin.mock({
					jsh: {
						file: jsh.file,
						tools: {
							git: jsh.tools.git
						},
						shell: {
							environment: {
								PROJECT: directory.pathname.toString()
							}
						},
						ui: {}
					}
				});
				var plugin = mock.jsh.wf;

				jsh.shell.console(Object.keys(plugin).toString());

				var prohibitModifiedSubmodules = function(module) {
					return module.prohibitModifiedSubmodules({ repository: parent })
				};

				verify(plugin).evaluate(prohibitModifiedSubmodules).threw.nothing();

				subdirectory.getRelativePath("c").write("", { append: false });
				verify(plugin).evaluate(prohibitModifiedSubmodules).threw.type(Error);

				verify(parent).submodule().length.is(1);
			};
		}
	//@ts-ignore
	)(fifty)
}

(
	function(
		jsh: slime.jsh.Global,
		verify: slime.definition.verify.Verify,
		run: slime.fifty.test.run,
		tests: any,
		$loader: slime.Loader & { getRelativePath: any, plugin: any }
	) {
		tests.types.Exports = function(module: slime.jsh.wf.Exports,jsh: slime.jsh.Global) {
			(function() {
				var invocation = {
					options: {},
					arguments: ["--foo", "bar"]
				};
				module.cli.$f.option.string({
					longname: "baz"
				})(invocation);
				verify(invocation).options.evaluate.property("foo").is(void(0));
				verify(invocation).arguments.length.is(2);
			})();

			(function() {
				var invocation = {
					options: {},
					arguments: ["--foo", "bar"]
				};
				module.cli.$f.option.string({
					longname: "foo"
				})(invocation);
				verify(invocation).options.evaluate.property("foo").is("bar");
				verify(invocation).arguments.length.is(0);
			})();

			(function() {
				var invocation = {
					options: {
						baz: false
					},
					arguments: ["--baz", "--bizzy"]
				};
				module.cli.$f.option.boolean({
					longname: "baz"
				})(invocation);
				verify(invocation).options.baz.is(true);
				verify(invocation).options.evaluate.property("bizzy").is(void(0));
				verify(invocation).arguments.length.is(1);
				verify(invocation).arguments[0].is("--bizzy");
			})();

			(function() {
				var invocation: { arguments: string[], options: { a: string, b: boolean }} = <{ arguments: string[], options: { a: string, b: boolean }}>module.cli.invocation(
					//	TODO	should module.$f.option.string("a") work?
					module.cli.$f.option.string({ longname: "a" }),
					module.cli.$f.option.boolean({ longname: "b" }),
					module.cli.$f.option.string({ longname: "aa" }),
					module.cli.$f.option.boolean({ longname: "bb" })
				);
				verify(invocation).arguments.length.is(2);
				verify(invocation).arguments[0] == "--c";
				verify(invocation).arguments[1] == "c";
				verify(invocation).options.a.is("aaa");
				verify(invocation).options.b.is(true);
				verify(invocation).options.evaluate.property("aa").is(void(0));
				verify(invocation).options.evaluate.property("bb").is(void(0));
			})();
		}

		tests.suite = function() {
			var global = (function() { return this; })();
			var mockjsh = {
				script: {
					arguments: ["--a", "aaa", "--b", "--c", "c"]
				},
				file: jsh.file,
				shell: jsh.shell,
				ui: jsh.ui,
				tools: jsh.tools
			};
			var mock = $loader.plugin.mock({
				jsh: mockjsh
			});
			var plugin = mock.jsh.wf;
			if (!plugin) {
				throw new TypeError("No jsh.wf loaded.");
			}
			tests.types.Exports(plugin, global.jsh);

			run(tests.exports.requireGitIdentity);
			run(tests.exports.prohibitModifiedSubmodules);
		}
	}
//@ts-ignore
)( (function() { return this; })().jsh, verify, run, tests, $loader)
