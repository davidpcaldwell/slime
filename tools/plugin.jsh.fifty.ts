/**
 * A set of APIs that can be helpful in implementing tasks related to software development. The [[Exports]] object represents the
 * main `jsh.wf` APIs project authors can use in constructing their own `wf` commands, including the `cli.initialize` method that
 * provides a standard project {@link slime.jsh.wf.standard.Interface | Interface} given a set of project
 * {@link slime.jsh.wf.standard.Operations | Operations}.
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

	namespace Exports.requireGitIdentity {
		export type get = GitIdentityProvider
	}

	export namespace cli {
		export interface Context {
			/** The project directory. */
			base: slime.jrunscript.file.Directory
		}

		export interface Arguments {
			/** Global options passed to `wf`. Currently, none are defined. */
			options: { [x: string]: any },
			/** The set of arguments to the `wf` command, not including global options. */
			arguments: string[]
		}

		export interface Invocation extends Arguments {
			command: string
		}

		export interface Command {
			(p: Arguments): void
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

		export type Processor = (p: cli.Arguments) => cli.Arguments

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
	 * The `cli.initialize` function provides a default `wf` implementation for projects with a number of standard commands; it
	 * requires project-level specification of operations like `commit`, `lint`, and/or `test`.
	 */
	export interface Exports {
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
					parse: (p: cli.Arguments) => cli.Invocation

					/**
					 * @throws { cli.error.TargetNotFound } if the specified target is not found on the interface
					 * @throws { cli.error.TargetNotFunction } if the specified target is not a function
					 */
					target: (p: { interface: cli.Interface, target: string }) => cli.Command

					process: (p: { interface: cli.Interface, invocation: cli.Invocation }) => void

					/**
					 * Executes a command, derived from the first available argument, on the given interface with the remaining
					 * arguments following the command.
					 */
					execute: (p: { interface: cli.Interface, arguments: cli.Arguments }) => void
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
					f: (p: cli.Arguments) => T
				) => T
			}

			/**
			 * Provides an imperative way to process the arguments of a script. The function takes an array of argument
			 * revisers and returns the result of processing `jsh.script.arguments` through the revisers.
			 */
			invocation: {
				(mutator: cli.Processor, m2: cli.Processor, m3: cli.Processor, m4: cli.Processor): cli.Arguments
				(mutator: cli.Processor, m2: cli.Processor, m3: cli.Processor): cli.Arguments
				(mutator: cli.Processor, m2: cli.Processor): cli.Arguments
				(mutator: cli.Processor): cli.Arguments
			}

			initialize: {
				(
					$context: jsh.wf.cli.Context,
					operations: standard.Operations,
					$exports: standard.Interface
				): void
			}
		}

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
			tsc: (p?: { project: slime.jrunscript.file.Directory }) => void
			typedoc: (p?: { project: slime.jrunscript.file.Directory }) => void
		}

		/**
		 * Errs if files untracked by Git are found in the given repository.
		 */
		prohibitUntrackedFiles: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void
	}

	export interface Exports {
		/**
		 * Errs if the given repository does not supply Git `user.name` and `user.email`
		 * values. Callers may provide an implementation that obtains the configuration values, including a provided
		 * implementation that prompts the user in a GUI dialog.
		 */
		requireGitIdentity: ( (p: {
			repository: slime.jrunscript.git.Repository.Local,
			get?: Exports.requireGitIdentity.get
		}, events?: $api.Events.Function.Receiver) => void) & { get: {
			gui: Exports.requireGitIdentity.get
		} }
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			fifty.tests.exports = {};

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

			fifty.tests.exports.prohibitModifiedSubmodules = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
				jsh.shell.console("directory = " + directory);
				var parent = jsh.tools.git.init({ pathname: directory.pathname });
				directory.getRelativePath("a").write("a", { append: false });
				parent.add({ path: "." });
				parent.commit({ all: true, message: "message a" });
				var subdirectory = directory.getRelativePath("sub").createDirectory();
				var child = jsh.tools.git.init({ pathname: subdirectory.pathname });
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
