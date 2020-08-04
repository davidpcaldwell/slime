namespace jsh.wf {
	namespace Exports.requireGitIdentity {
		export interface get {
			name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
			email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
		}
	}

	export interface Context {
		base: slime.jrunscript.file.Directory
	}

	export type Mutator<T> = <T>(t: T) => void

	export namespace cli {
		export interface Arguments {
			options: { [x: string]: any },
			arguments: string[]
		}

		export interface Command {
			(p: Arguments): void
		}
	}

	export interface Exports {
		cli: {
			$f: {
				option: {
					string: (c: { longname: string }) => Mutator<cli.Arguments>
					boolean: (c: { longname: string }) => Mutator<cli.Arguments>
				}
			}

			invocation: {
				(mutator: Mutator<cli.Arguments>, m2: Mutator<cli.Arguments>, m3: Mutator<cli.Arguments>, m4: Mutator<cli.Arguments>): cli.Arguments
				(mutator: Mutator<cli.Arguments>, m2: Mutator<cli.Arguments>, m3: Mutator<cli.Arguments>): cli.Arguments
				(mutator: Mutator<cli.Arguments>, m2: Mutator<cli.Arguments>): cli.Arguments
				(mutator: Mutator<cli.Arguments>): cli.Arguments
			}

			initialize: {
				(
					$context: jsh.wf.Context,
					operations: {
						test?: () => boolean
						commit?: (p: { message: string }) => void
					},
					$exports: {
						status: jsh.wf.cli.Command
						tsc: jsh.wf.cli.Command
						submodule: {
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
