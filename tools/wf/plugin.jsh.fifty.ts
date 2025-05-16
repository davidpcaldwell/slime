//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

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
 * ## Initializing a `wf` project
 *
 * The easiest way to initialize a project with a simple `wf` configuration is to run the `tools/wf/install` script, either
 * specifying the project root using its `--project` argument, or by running the script from the project's working directory.
 * This will set up some simple defaults.
 *
 * ## Configuring a `wf` project
 *
 * The `tools/wf` script expects the project to define the `PROJECT` environment variable to point to the root of the project.
 * Otherwise, it will try to use the working directory as the project root.
 *
 * So, a typical `wf` script for a project might look like this:
 * ```bash
 * #!/bin/bash
 * export PROJECT="$(dirname $0)"
 * $(dirname $0)/path/to/slime/tools/wf.bash "$@"
 * ```
 *
 * The `wf.js` file should be an ordinary SLIME module, which will be loaded with a `$context` providing a project
 * {@link slime.jsh.wf.cli.Context | Context}. Each function `wf.js` exports
 * will be interpreted as a command which can be executed by name, and will receive an argument specified by
 * {@link slime.jsh.script.cli.Command}. Commands can use the {@link slime.jsh.wf.Exports | `jsh.wf`} APIs
 * as part of their implementation.
 *
 * If a project provides an `initialize` command, it is executed prior to every `wf` command (and should thus be idempotent). When
 * the `initialize` command is executed due to the invocation of another command, it will receive an empty argument list.
 *
 * ## Using the standard project implementation and `git` hooks
 *
 * In particular, `jsh.wf` provides the
 * {@link slime.jsh.wf.Exports | project.initialize} method that
 * enables authors to provide a {@link slime.jsh.wf.standard.Interface | standard set} of `wf` commands given a
 * {@link slime.jsh.wf.standard.Project | Project} definition that provides implementations for a few basic operations.
 *
 * This standard project implementation also provides implementations for `git` hooks, which can be used if they are enabled; see
 * below.
 *
 * The `jsh.wf.project.git.installHooks()` call from within `initialize` will install `git` hooks that piggyback off the standard
 * implementation operations.
 */
namespace slime.jsh.wf {
	/**
	 * @deprecated Replaced by inputs.GitIdentityProvider
	 */
	export interface GitIdentityProvider {
		name: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => string,
		email: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => string
	}

	export namespace cli {
		export interface Context {
			/** The project directory. */
			base: slime.jrunscript.file.Directory
		}

		export interface CommandInvocation extends jsh.script.cli.Invocation<any> {
			command: string
		}

		export interface Interface extends slime.jsh.script.cli.Commands {
			/**
			 * A special {@link Command} that is run each time any (other) `Command` is run.
			 */
			 initialize?: slime.jsh.script.cli.Command
		}
	}

	export interface Submodule extends slime.jrunscript.tools.git.oo.Submodule {
		status: ReturnType<slime.jrunscript.tools.git.repository.Local["status"]>
		state: ReturnType<ReturnType<Exports["git"]["compareTo"]>>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		typescript: {
			/**
			 * Ensures that Node.js is installed and that the project-appropriate version of TypeScript is present.
			 */
			require: (p?: { project: slime.jrunscript.file.Directory }) => void

			/**
			 * @deprecated Replaced by {@link slime.jsh.wf.exports.Checks | jsh.wf.checks.tsc()}.
			 */
			tsc: (p?: { project: slime.jrunscript.file.Directory }) => boolean

			/**
			 * Runs TypeDoc on the project, emitting the output to `local/doc/typedoc`.
			 */
			typedoc: {
				now: (
					/**
					 * Information about the project. Defaults to running on the `wf` project directory.
					 */
					p?: {
						project: slime.jrunscript.file.Directory
						stdio?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["stdio"]
					}
				) => boolean

				invocation: (
					p: {
						project: slime.jsh.wf.Project
						stdio?: Parameters<slime.jrunscript.shell.Exports["Invocation"]["create"]>[0]["stdio"]
						out?: string
					}
				) => slime.$api.fp.world.Question<slime.jrunscript.shell.run.AskEvents, slime.jrunscript.shell.run.Exit>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			var project = {
				base: fifty.jsh.file.relative("../..").pathname
			};

			var out = fifty.jsh.file.temporary.directory();

			fifty.tests.manual.typedoc = function() {
				var invocation = jsh.wf.typescript.typedoc.invocation({
					project: project,
					stdio: {
						output: "line",
						error: "line"
					},
					out: out.pathname
				});
				jsh.shell.console(JSON.stringify(invocation));
				var exit = $api.fp.world.now.ask(
					invocation,
					{
						start: function(e) {
							jsh.shell.console("PID: " + e.detail.pid);
						},
						stdout: function(e) {
							jsh.shell.console("STDOUT: " + e.detail.line);
						},
						stderr: function(e) {
							jsh.shell.console("STDERR: " + e.detail.line);
						}
					}
				);
				jsh.shell.console("Status: " + exit.status);
				jsh.shell.console("Output to " + out.pathname);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface ProjectView {
		base: slime.$api.fp.impure.Input<slime.jrunscript.file.Directory>

		git: {
			installHooks: slime.$api.fp.impure.Process
			installSlimeCredentialHelper: slime.$api.fp.impure.Process
		}

		lint: {
			eslint(): boolean
		}

		Submodule: {
			construct: (git: slime.jrunscript.tools.git.oo.Submodule) => Submodule
		}

		submodule: {
			status: () => Submodule[]
			remove: (p: { path: string }) => void
			attach: (p: { path: string, recursive: boolean }) => void
		}

		//	TODO	move to submodule.update
		updateSubmodule: (p: { path: string }) => void

		subproject: {
			initialize: {
				action: slime.$api.fp.world.Means<{ path: string }, slime.jrunscript.shell.run.TellEvents>

				/**
				 * Returns a `Process` that will execute `action` using the given path, and rerouting `stderr` events from the
				 * initialization to the console, with a prefix identifying the subproject emitting them.
				 *
				 * @param path The path of the subproject to initialize
				 * @returns A `Process` that will execute the initialization.
				 */
				process: (path: string) => slime.$api.fp.impure.Process
			}
		}

		subprojects: {
			initialize: {
				process: slime.$api.fp.impure.Process
			}
		}

		/**
		 * Given a {@link standard.Project} defining a few simple operations, initializes the given `$exports` object
		 * with a standard set of `wf` commands defined by {@link standard.Interface}.
		 */
		initialize: standard.Export
	}

	/**
	 * The `project.initialize` function provides a default `wf` implementation for projects with a number of standard commands; it
	 * requires project-level specification of operations like `commit`, `lint`, and/or `test`.
	 */
	export interface Exports {
		error: {
			Failure: $api.error.old.Type<"jsh.wf.Failure",{}>
		}

		/**
		 * Provides a set of operations that can be performed on the current `Project`, where "current" is defined by the `PROJECT`
		 * environment variable (if set), and otherwise by the current working directory.
		 */
		project: ProjectView

		git: {
			commands: {
				getBranches: slime.jrunscript.tools.git.Command<void,{ current: boolean, name: string }[]>
			}

			fetch: () => slime.jrunscript.tools.git.repository.Local

			compareTo: (branchName: string) =>
				(repository: slime.jrunscript.tools.git.repository.Local) => {
					ahead: slime.jrunscript.tools.git.Commit[],
					behind: slime.jrunscript.tools.git.Commit[],
					paths: any
				}
		}
	}

	export interface Exports {
		cli: {
			$f: {
				command: {
					/**
					 * Converts a set of arguments whose first argument describes a command to an invocation that indicates
					 * that command and includes the remaining arguments.
					 */
					parse: (p: jsh.script.cli.Invocation<any>) => cli.CommandInvocation

					/**
					 * @throws { slime.jsh.script.cli.error.TargetNotFound } if the specified target is not found on the interface
					 * @throws { slime.jsh.script.cli.error.TargetNotFunction } if the specified target is not a function
					 */
					target: (p: { interface: cli.Interface, target: string }) =>  slime.jsh.script.cli.Command<any>

					process: (p: { interface: cli.Interface, invocation: cli.CommandInvocation }) => void

					/**
					 * Executes a command, derived from the first available argument, on the given interface with the remaining
					 * arguments following the command.
					 */
					execute: (p: { interface: cli.Interface, arguments: jsh.script.cli.Invocation<any> }) => void
				}

				/**
				 * Returns an object representing the global invocation of `jsh`.
				 *
				 * @deprecated Can be replaced by `jsh.script.cli.invocation()`.
				 */
				invocation: <T>(
					f: (p: jsh.script.cli.Invocation<any>) => T
				) => T
			}

			/** @deprecated Replaced by `project.initialize`. */
			initialize: Exports["project"]["initialize"]
		}
	}

	export namespace exports {
		export interface Checks {
		}

		export interface Inputs {
		}
	}

	export interface Exports {
		checks: exports.Checks
		inputs: exports.Inputs
	}

	export namespace inputs {
		/**
		 * An object that, given a Git repository, can provide the Git user.name and user.email values for that repository (perhaps
		 * by prompting the user).
		 */
		export interface GitIdentityProvider {
			name: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => string,
			email: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => string
		}
	}

	export namespace exports {
		export interface Inputs {
			gitIdentityProvider: {
				/**
				 * A {@link inputs.GitIdentityProvider} that asks for values for `user.name` and `user.email` via the desktop GUI.
				 */
				gui: inputs.GitIdentityProvider
			}
		}
	}

	export namespace exports {
		export interface Checks {
			requireGitIdentity: (p: {
				repository: slime.jrunscript.tools.git.repository.Local
				get?: GitIdentityProvider
			}) => slime.$api.fp.world.old.Ask<
				{
					console: string
					debug: string
				},
				boolean
			>
		}
	}

	export interface Exports {
		/**
		 * Errs if the given repository does not supply Git `user.name` and `user.email`
		 * values. Callers may provide an implementation that obtains the configuration values if they are missing, including a
		 * provided implementation that prompts the user in a GUI dialog.
		 *
		 * @deprecated Replaced by checks.requireGitIdentity
		 */
		 requireGitIdentity: {
			(p: {
				repository: slime.jrunscript.tools.git.repository.Local
				get?: GitIdentityProvider
			}, events?: $api.event.Function.Receiver)

			/**
			 * @deprecated
			 */
			get: {
				/**
				 * @deprecated Replaced by inputs.gitIdentityProvider.gui
				 */
				gui: GitIdentityProvider
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			fifty.tests.exports.requireGitIdentity = function() {
				//	TODO	disabled for now because of issue #896, tsc disappearing at runtime, to see whether this task is at
				//			work
				if (false && jsh.shell.PATH.getCommand("git")) {
					fifty.run(fifty.tests.exports.requireGitIdentity.first);
					fifty.run(fifty.tests.exports.requireGitIdentity.second);
					fifty.run(fifty.tests.exports.requireGitIdentity.third);
				}
			};

			fifty.tests.exports.requireGitIdentity.first = function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
				jsh.tools.git.oo.init({ pathname: directory.pathname });
				var unconfigured = jsh.tools.git.oo.Repository({ directory: directory });
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
				jsh.tools.git.oo.init({ pathname: directory.pathname });
				var toConfigure = jsh.tools.git.oo.Repository({ directory: directory });
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
				jsh.tools.git.oo.init({ pathname: directory.pathname });
				var configured = jsh.tools.git.oo.Repository({ directory: directory });
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
	)(fifty);

	export namespace exports {
		export interface Checks {
			noUntrackedFiles: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => slime.$api.fp.world.old.Ask<{
				console: string
				untracked: string[]
			},boolean>
		}
	}

	export interface Exports {
		/**
		 * Errs if files untracked by Git are found in the given repository.
		 */
		prohibitUntrackedFiles: (p: { repository: slime.jrunscript.tools.git.repository.Local }, events?: $api.event.Function.Receiver) => void
	}

	export namespace exports {
		export interface Checks {
			noModifiedSubmodules: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => slime.$api.fp.world.old.Ask<
				{
					console: string
				},
				boolean
			>
		}
	}

	export interface Exports {
		prohibitModifiedSubmodules: (p: { repository: slime.jrunscript.tools.git.repository.Local }, events?: $api.event.Function.Receiver) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			function configure(repository: slime.jrunscript.tools.git.repository.Local) {
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
				var check = function(message) {
					var tsc = jsh.shell.jsh.src.getRelativePath("local/jsh/lib/node/bin/tsc");
					jsh.shell.console(message + " tsc " + tsc + " exists: " + tsc.java.adapt().exists());
				}
				//	TODO	disabled for now because of issue #896, tsc disappearing at runtime, to see whether this task is at
				//			work
				if (false && jsh.shell.PATH.getCommand("git")) {
					check("start");
					var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
					check("after tmpdir");
					jsh.shell.console("directory = " + directory);
					var parent = jsh.tools.git.oo.init({ pathname: directory.pathname });
					check("after init");
					configure(parent);
					check("after configure parent " + parent);
					directory.getRelativePath("a").write("a", { append: false });
					check("after file write");
					parent.add({ path: "." });
					check("after repository add");
					parent.commit({ all: true, message: "message a" });
					check("after repository commit a");
					var subdirectory = directory.getRelativePath("sub").createDirectory();
					var child = jsh.tools.git.oo.init({ pathname: subdirectory.pathname });
					check("after init child " + child);
					configure(child);
					check("after configure child");
					subdirectory.getRelativePath("b").write("b", { append: false });
					child.add({ path: "." });
					child.commit({ all: true, message: "message b" });
					check("after commit b child");
					verify(parent).submodule().length.is(0);
					check("after submodule length 0; before submodule add");
					parent.submodule.add({
						repository: child,
						path: "sub"
					});
					check("after submodule add");

					var mock = fifty.jsh.plugin.mock({
						jsh: {
							file: jsh.file,
							//@ts-ignore
							tools: {
								git: jsh.tools.git
							},
							//@ts-ignore
							shell: {
								environment: {
									PROJECT: directory.pathname.toString()
								},
								PATH: jsh.shell.PATH,
								tools: jsh.shell.tools
							},
							//@ts-ignore
							ui: {}
						}
					});
					check("after plugin mock");
					var plugin: slime.jsh.wf.Exports = mock.jsh.wf;

					jsh.shell.console(Object.keys(plugin).toString());

					var prohibitModifiedSubmodules = function(module: Exports) {
						return module.prohibitModifiedSubmodules({ repository: parent })
					};

					check("before first call");
					verify(plugin).evaluate(prohibitModifiedSubmodules).threw.nothing();
					check("after first call");

					subdirectory.getRelativePath("c").write("", { append: false });
					check("after subdirectory write");
					//	TODO	somehow, the below call was causing tsc to be erased (?!?) and future execution of TypeScript not
					//			to work, at least in Docker. If you trace the call below into the module, there appears to be
					//			nothing that could possibly do this; it lists the submodules, checks the status of each, and throws
					//			an error if any are modified. But in any case, we'll disable this test using the if(false) above
					verify(plugin).evaluate(prohibitModifiedSubmodules).threw.type(Error);
					check("after second call");

					verify(parent).submodule().length.is(1);
					check("after check for submodule count");
				}
			};
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Checks {
			noDetachedHead: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => slime.$api.fp.world.old.Ask<
				{
					console: string
				},
				boolean
			>
		}
	}

	export namespace exports {
		export interface Checks {
			upToDateWithOrigin: (p: { repository: slime.jrunscript.tools.git.repository.Local }) => slime.$api.fp.world.old.Ask<
				{
					console: string
				},
				boolean
			>
		}
	}

	export namespace exports {
		export interface Checks {
			tsc: slime.$api.fp.world.Sensor<void,{ console: string, output: string },boolean>
		}
	}

	export namespace exports {
		export interface Checks {
			lint: (p?: {
				isText?: slime.tools.code.isText
				trailingWhitespace?: boolean
				handleFinalNewlines?: boolean
			}) => Lint
		}
	}

	export interface Lint {
		check: slime.$api.fp.world.Question<
			{
				console: string
			},
			boolean
		>

		fix: slime.$api.fp.world.Action<{
			console: string
		}>
	}

	export type Test = slime.$api.fp.world.Question<
		{
			output: string
			console: string
		},
		boolean
	>

	export type Precommit = slime.$api.fp.world.old.Ask<
		{
			console: string
		},
		boolean
	>

	export namespace exports {
		export interface Checks {
			precommit: (p?: {
				lint?: Lint["check"]
				test?: Test
			}) => Precommit
		}
	}

	export interface Exports {
		Project: {
			input: slime.$api.fp.impure.Input<Project>
			getTypescriptVersion: (project: Project) => string
			getConfigurationFile: (project: Project) => slime.jrunscript.file.world.Location
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;
			const subject = jsh.wf;

			fifty.tests.world = {};

			fifty.tests.world.Project = function() {
				var project = subject.Project.input();
				jsh.shell.console(project.base);
				var typescriptVersion = subject.Project.getTypescriptVersion(project);
				jsh.shell.console("typescript version = " + typescriptVersion);
				var configuration = subject.Project.getConfigurationFile(project);
				jsh.shell.console("configuration file = " + configuration.pathname);
			}
		}
	//@ts-ignore
	)(fifty);


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { tests, run } = fifty;
			const { jsh } = fifty.global;

			tests.suite = function() {
				fifty.load("module.fifty.ts");

				run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty)
}
