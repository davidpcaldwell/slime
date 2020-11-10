namespace jsh.wf {
	/**
	 * An object that, given a Git repository, can provide the Git user.name and user.email values for that repository (perhaps
	 * by prompting the user).
	 */
	interface GitIentityProvider {
		name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
		email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
	}

	namespace Exports.requireGitIdentity {
		export type get = GitIentityProvider
	}

	export namespace cli {
		export interface Context {
			base: slime.jrunscript.file.Directory
		}

		export interface Arguments {
			options: { [x: string]: any },
			arguments: string[]
		}

		export interface Invocation extends Arguments {
			command: string
		}

		export interface Command {
			(p: Arguments): void
		}

		export interface Interface {
			[x: string]: ( Command | Interface )
		}

		export type Processor = $api.Function.impure.Updater<cli.Arguments>

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
					operations: {
						lint?: () => boolean
						test?: () => boolean
						commit?: (p: { message: string }) => void
					},
					$exports: {
						status: jsh.wf.cli.Command
						tsc: jsh.wf.cli.Command
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
						},
						commit: any
					}
				): void
			}
		}

		project: {
			base: slime.jrunscript.file.Directory
			submodule: {
				status: () => Array<{
					path: string
					branch: slime.jrunscript.git.Branch
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
			tsc: () => void
		}

		requireGitIdentity: ( (p: {
			repository: slime.jrunscript.git.Repository.Local,
			get?: Exports.requireGitIdentity.get
		}, events?: $api.Events.Function.Receiver) => void) & { get: {
			gui: Exports.requireGitIdentity.get
		} }

		/**
		 * Errs if files untracked by Git are found in the given repository.
		 */
		prohibitUntrackedFiles: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void

		prohibitModifiedSubmodules: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void
	}
}

(
	function(
		jsh: jsh,
		verify: slime.definition.verify.Verify,
		run: (f: () => void, name: string) => void,
		tests: any,
		$loader: slime.Loader & { getRelativePath: any, plugin: any }
	) {
		tests.types.Exports = function(module: jsh.wf.Exports,jsh: jsh) {
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
				path: "./",
				global: {
					jsh: mockjsh
				},
				plugins: {}
			});
			var plugin = mock.jsh.wf;
			if (!plugin) {
				throw new TypeError("No jsh.wf loaded.");
			}
			tests.types.Exports(plugin, global.jsh);
		}
	}
//@ts-ignore
)( (function() { return this; })().jsh, verify, run, tests, $loader)
