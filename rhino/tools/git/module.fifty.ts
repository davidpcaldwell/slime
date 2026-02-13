//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides access to the `git` command-line tool from scripts.
 *
 * The main world-oriented entry point is the {@link slime.jrunscript.tools.git.Exports} `program` function, which returns an API that allows the usage
 * of commands against a particular executable; this function can then be chained with `repository` (targeting a specific
 * repository), `command` (executing a specific {@link slime.jrunscript.tools.git.Command} toward that repository), `argument` (passing
 * specific information to that command), and finally, `run`, which executes the command, optionally supplying a world
 * implementation and event handlers for the `stdout` and `stderr` streams.
 *
 * Several opinionated `Command` implementations for specific `git` commands are provided by the
 * {@link slime.jrunscript.tools.git.Commands | `commands` export}.
 *
 * ## Tools
 *
 * SLIME also implements a {@link slime.jrunscript.tools.git.credentials Git credential helper} that can look up passwords (or, in
 * the case of GitHub and GitLab, tokens) in the file system for a project by host and username.
 */
namespace slime.jrunscript.tools.git {
	export interface Branch {
		/**
		 * The name of this branch. Can be `null` if this "branch" is a detached HEAD.
		 */
		name: string
		current: boolean
		commit: Commit
	}

	export namespace internal {
		export interface Environment {
			[x: string]: string
		}

		export interface InvocationConfiguration<T> {
			arguments?: (p: T) => $api.fp.object.Revision<string[]>
			environment?: (p: T) => $api.fp.object.Revision<Environment>,
			createReturnValue?: (p: T) => (result: Result) => any
		}

		export interface GitCommand<T> {
			name: string
			configure: <S extends T>(p: T) => InvocationConfiguration<S>
		}

		export interface Result {
			output: {
				stdout: string[]
				stderr: string[]
			}

			//	TODO	this should be the datatype returned by rhino/shell.run(), which is currently not declared
			result: {
				status: number
			}
		}

		interface Command {
			name: string
		}
	}

	export namespace internal {
		export const subject = (
			function(fifty: slime.fifty.test.Kit) {
				return fifty.global.jsh.tools.git;
			}
		//@ts-ignore
		)(fifty);

		export namespace old {
			export interface Fixtures {
				init: slime.jrunscript.tools.git.Exports["oo"]["init"]
				write: (p: {
					repository?: repository.Local
					directory?: slime.jrunscript.file.Directory
					files: {
						[path: string]: string
					}
				}) => void
			}

			export const fixtures: Fixtures = (
				function(fifty: slime.fifty.test.Kit) {
					return fifty.$loader.file("fixtures-old.ts", { module: subject });
				}
			//@ts-ignore
			)(fifty);
		}
	}

	(function(fifty: slime.fifty.test.Kit) {
		const { verify, run } = fifty;

		var debug = function(s) {
			fifty.global.jsh.shell.console(s);
		}

		var commitFile = function(repository: git.repository.Local,p) {
			var path = p;
			repository.directory.getRelativePath(path).write(path, { append: false });
			repository.add({ path: path });
			repository.commit({ all: true, message: path }, {
				stdout: function(e) {
					fifty.global.jsh.shell.console(e.detail);
				},
				stderr: function(e) {
					fifty.global.jsh.shell.console(e.detail);
				}
			});
		};

		/**
		 * Adds placeholder `user.name` and `user.email` values to this repository.
		 *
		 * @param repository
		 */
		function configure(repository: git.repository.Local) {
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

		fifty.tests.submoduleTrackingBranch = function() {
			function initialize() {
				var tmpdir = fifty.jsh.file.object.temporary.directory();

				var library = internal.subject.oo.init({ pathname: tmpdir.getRelativePath("sub") });
				configure(library);
				commitFile(library, "b");

				var parent = internal.subject.oo.init({ pathname: tmpdir.getRelativePath("parent") });
				configure(parent);
				commitFile(parent, "a");

				return { library, parent };
			}

			run(function trackingMaster() {
				const { parent, library } = initialize();
				var subbranch = library.status().branch.name;
				const submodule = parent.submodule.add({ repository: library, path: "path/sub", name: "sub", branch: subbranch, config: {
					//	See https://vielmetti.typepad.com/logbook/2022/10/git-security-fixes-lead-to-fatal-transport-file-not-allowed-error-in-ci-systems-cve-2022-39253.html
					"protocol.file.allow": "always"
				} });
				configure(submodule);
				parent.commit({ all: true, message: "add submodule"});
				var submodules = parent.submodule();
				verify(submodules)[0].branch.is(subbranch);
			});

			run(function trackingNothing() {
				const { parent, library } = initialize();
				const submodule = parent.submodule.add({ repository: library, path: "path/sub", name: "sub", config: {
					//	See https://vielmetti.typepad.com/logbook/2022/10/git-security-fixes-lead-to-fatal-transport-file-not-allowed-error-in-ci-systems-cve-2022-39253.html
					"protocol.file.allow": "always"
				} });
				configure(submodule);
				parent.commit({ all: true, message: "add submodule"});
				var submodules = parent.submodule();
				verify(submodules)[0].evaluate.property("branch").is(void(0));
			});
		}

		fifty.tests.submoduleWithDifferentNameAndPath = function() {
			var tmpdir = fifty.jsh.file.object.temporary.directory();

			var sub = internal.subject.oo.init({ pathname: tmpdir.getRelativePath("sub") });
			configure(sub);
			commitFile(sub, "b");
			var subbranch = sub.status().branch.name;

			var parent = internal.subject.oo.init({ pathname: tmpdir.getRelativePath("parent") });
			configure(parent);
			commitFile(parent, "a");

			debugger;
			var added = parent.submodule.add({ repository: sub, path: "path/sub", name: "sub", branch: subbranch, config: {
				//	See https://vielmetti.typepad.com/logbook/2022/10/git-security-fixes-lead-to-fatal-transport-file-not-allowed-error-in-ci-systems-cve-2022-39253.html
				"protocol.file.allow": "always"
			} });

			var submodules = parent.submodule();
			verify(submodules).length.is(1);
			verify(submodules)[0].evaluate.property("name").is("sub");
			verify(submodules)[0].path.is("path/sub");
			verify(submodules)[0].repository.reference.is(added.reference);
			verify(submodules)[0].evaluate.property("branch").is(subbranch);
			verify(submodules)[0].commit.subject.is("b");
			//	don't bother testing other fields of commit
		};

		fifty.tests.submoduleStatusCached = function() {
			var tmpdir = fifty.jsh.file.object.temporary.directory();

			var library = internal.subject.oo.init({ pathname: tmpdir.getRelativePath("sub") });
			configure(library);
			commitFile(library, "b");
			var branch = library.status().branch;

			var parent = internal.subject.oo.init({ pathname: tmpdir.getRelativePath("parent") });
			configure(parent);
			commitFile(parent, "a");

			var subrepository = parent.submodule.add({ repository: library, path: "path/sub", name: "sub", branch: branch.name, config: {
				//	See https://vielmetti.typepad.com/logbook/2022/10/git-security-fixes-lead-to-fatal-transport-file-not-allowed-error-in-ci-systems-cve-2022-39253.html
				"protocol.file.allow": "always"
			} });
			configure(subrepository);
			parent.commit({ all: true, message: "add submodule"});

			var before = subrepository.status().branch;
			commitFile(subrepository, "c");
			var after = subrepository.status().branch;

			//	cached: true shows the committed state of the submodule
			var cached = parent.submodule({ cached: true });
			verify(cached)[0].commit.commit.hash.is(before.commit.commit.hash);

			//	when not cached, shows the current state of the submodule in its directory
			var submodules = parent.submodule();
			verify(submodules)[0].commit.commit.hash.is(after.commit.commit.hash);
			verify(submodules)[0].repository.status().branch.commit.commit.hash.is(after.commit.commit.hash);
		};
	//@ts-ignore
	})(fifty);

	/**
	 * A `git` installation.
	 */
	export interface Program {
		command: slime.jrunscript.shell.invocation.Argument["command"]
	}

	export interface Invocation {
		command: string
		arguments?: string[]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.Exports = {};
		}
	//@ts-ignore
	)(fifty);

	/**
	 * A `git` command that can be configured with an (optional) value of a given type and returns an (optional) value of another
	 * specified type.
	 */
	export interface Command<P,R> {
		invocation: (parameter: P) => Invocation

		/**
		 * Converts the command output into the declared result type. If absent, an implementation that returns `undefined` will
		 * be provided.
		 */
		result?: (output: string) => R
	}

	export namespace command.status {
		export namespace old {
			export type Result = Pick<command.status.Result,"branch" | "paths">
		}
	}

	export namespace world {
		export type Config = { [name: string]: string }

		export interface Invocation<P,R> {
			program: Program

			config: Config

			/**
			 * The directory in which to run the command; most likely the repository on which it is intended to act.
			 */
			pathname: string

			/**
			 * A command implementation to run.
			 */
			command: Command<P,R>

			/**
			 * The argument to pass to the command implementation.
			 */
			argument: P

			/**
			 * An optional callback method to which each line of the command's standard output will be provided.
			 */
			stdout?: (line: string) => void

			/**
			 * An optional callback method to which each line of the command's standard error stream will be provided.
			 * If omitted, the stream will be redirected to the standard error stream of the parent process.
			 */
			stderr?: (line: string) => void

			world?: {
				/**
				 * An alternative implementation for the launching of the `git` subprocess. The most likely use case for
				 * this is in mocking.
				 */
				run: (invocation: slime.jrunscript.shell.run.minus2.Invocation) => slime.$api.fp.world.old.Tell<slime.jrunscript.shell.run.TellEvents>
			}
		}
	}

	export namespace exports {
		export namespace command {
			/**
			 * A function that provides the ability to execute a command against a given repository.
			 *
			 * When the command is executed, it may assume that its working directory is also the directory in which the repository
			 * is stored -- in other words, that it is not being executed with `-C` -- for the purposes of resolving relative paths
			 * and so forth.
			 */
			export type Executor = <P,R>(command: slime.jrunscript.tools.git.Command<P,R>) => {
				argument: (argument: P) => {
					/**
					 * Runs the resulting git command, sending any output emitted to the `stdout` and `stderr` callbacks. Uses the
					 * alternative `world` implementation if one is provided. If the `git` exit status is non-zero, throws an error.
					 */
					run: (p?: {
						stdout?: world.Invocation<P,R>["stdout"]
						stderr?: world.Invocation<P,R>["stderr"]
						world?: world.Invocation<P,R>["world"]
					}) => R
				}
			}
		}
	}

	export interface Exports {
		/**
		 * An opinionated object that provides a set of {@link Command} implementations deemed to be useful for `git` automation.
		 * If the exact combination of git commands and options for your use case is not provided here, you can implement your own
		 * {@link Command} which can be tailored to any set of commands, arguments, and options, any way of parsing output, and so
		 * forth.
		 */
		commands: Commands
	}

	export namespace submodule {
		/**
		 * The declared configuration of a submodule in `.gitmodules`, where all the properties for a given submodule name are pulled
		 * together into this structure. See [the Git documentation for `.gitmodules`](https://git-scm.com/docs/gitmodules) for the
		 * definitions of these values.
		 */
		export interface Configuration {
			name: string

			path: string
			url: string

			update?: string
			branch?: string
			fetchRecurseSubmodules?: string
			ignore?: "all" | "dirty" | "untracked" | "none"
			shallow?: string
		}
	}

	export interface RepositoryView {
		Invocation: <P,R>(p: {
			command: slime.jrunscript.tools.git.Command<P,R>
			argument: P
		}) => world.Invocation<P,R>

		shell: (p: {
			invocation: slime.jrunscript.tools.git.Invocation
			stdio: slime.jrunscript.shell.invocation.Argument["stdio"]
		}) => shell.run.minus2.Invocation

		command: exports.command.Executor

		run: <P,R>(p: {
			command: slime.jrunscript.tools.git.Command<P,R>
			input: P
			world?: world.Invocation<P,R>["world"]
		}) => R

		/**
		 * Determines the current submodule configuration declared for this repository, in other words, the configuration stored in
		 * `.gitmodules`, and returns it.
		 */
		gitmodules: () => submodule.Configuration[]
	}

	export interface Exports {
		program: (program: Program) => {
			Invocation: <P,R>(p: {
				pathname?: string
				command: slime.jrunscript.tools.git.Command<P,R>
				argument: P
			}) => world.Invocation<P,R>

			repository: (pathname: string) => RepositoryView

			config: (values: { [name: string]: string }) => {
				//	TODO	refactor so this can return RepositoryView also
				repository: (pathname: string) => RepositoryView

				command: exports.command.Executor
			}

			command: exports.command.Executor
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.Exports.program = function() {
				fifty.run(function program() {
					var invocation = internal.subject.program({ command: "blah" }).Invocation({
						pathname: "/foo/path",
						command: internal.subject.commands.status,
						argument: void(0)
					});

					//	TODO	appears to work in latest TypeScript
					//@ts-ignore
					fifty.verify(invocation).program.command.evaluate(String).is("blah");
					fifty.verify(invocation).pathname.is("/foo/path");
				});

				fifty.run(function command() {
					var executor = internal.subject.program({ command: "sigh" })
						.command(internal.subject.commands.status)
						.argument()
					;
					var invocation: shell.run.minus2.Invocation;
					executor.run({
						world: {
							run: function(created: shell.run.minus2.Invocation) {
								invocation = created;
								return fifty.global.$api.fp.world.old.tell(function(events) {
									events.fire("exit", {
										status: 0,
										stdio: {
											output: ""
										}
									});
								});
							}
						}
					});

					//	TODO	appears to work in latest TypeScript
					//@ts-ignore
					fifty.verify(invocation).configuration.command.evaluate(String).is("sigh");
					fifty.verify(invocation).context.directory.is(fifty.global.jsh.shell.PWD.toString());
				});

				fifty.run(function repository() {
					var invocation = internal.subject.program({ command: "sigh" }).repository("/bar/path").Invocation({
						command: internal.subject.commands.status,
						argument: void(0)
					});

					//	TODO	appears to work in latest TypeScript
					//@ts-ignore
					fifty.verify(invocation).program.command.evaluate(String).is("sigh");
					fifty.verify(invocation).pathname.is("/bar/path");
				});

				fifty.run(function run() {
					var command: Command<number,number> = {
						invocation: function(i) {
							return {
								command: "titans-go",
								arguments: [String(i)]
							}
						},
						result: function(string) {
							return Number(string);
						}
					};

					var mock = fifty.global.jsh.shell.world.mock(
						function(invocation) {
							invoked = invocation;
							return {
								lines: [
									{ stderr: "e1" },
									{ stdout: String(Number(invocation.configuration.arguments[1]) * 2) },
									{ stderr: "e2" }
								],
								exit: {
									status: 0,
									//	TODO	should not be required
									stdio: void(0)
								}
							}
						}
					);

					var invoked: shell.run.minus2.Invocation;
					var stderr: string[] = [];
					var stdout = [];
					var output = internal.subject.program({ command: "boo" })
						.repository("/baz/path")
						.command(command)
						.argument(3)
						.run({
							stdout: function(line) {
								stdout.push(line);
							},
							stderr: function(line) {
								stderr.push(line);
							},
							world: {
								run: mock
							}
						})
					;

					fifty.verify(output).is(6);
					fifty.verify(stdout).length.is(1);
					fifty.verify(stderr).length.is(2);
					fifty.verify(stderr)[0].is("e1");
					fifty.verify(stderr)[1].is("e2");
					fifty.verify(invoked).configuration.command.is("boo");
					fifty.verify(invoked).configuration.arguments[0].is("titans-go");
					fifty.verify(invoked).configuration.arguments[1].is("3");
					fifty.verify(invoked).context.directory.is("/baz/path");
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		run: <P,R>(p: world.Invocation<P,R>) => R

		Invocation: {
			shell: (p: {
				program: slime.jrunscript.tools.git.Program
				pathname?: string
				invocation: slime.jrunscript.tools.git.Invocation
				stdio: slime.jrunscript.shell.invocation.Argument["stdio"]
			}) => shell.run.minus2.Invocation
		}
	}

	(
		function(
			$api: slime.$api.Global,
			fifty: slime.fifty.test.Kit
		) {
			var exports: Exports = fifty.global.jsh.tools.git;
			fifty.tests.test = {};
			fifty.tests.test.run = function() {
				type i = { foo: number };
				type o = { bar: number };
				var command: Command<i,o> = {
					invocation: function(i) {
						return {
							command: "command",
							arguments: ["--foo", String(i.foo)]
						}
					},
					result: function(o) {
						return { bar: Number(o) };
					}
				}
				fifty.verify(exports).run.is.type("function");

				var output = exports.run({
					program: { command: "c" },
					config: {},
					pathname: "/pathname/foo",
					command: command,
					argument: { foo: 2 },
					world: {
						run: fifty.global.jsh.shell.world.mock(
							function(invocation) {
								return {
									exit: {
										status: 0,
										stdio: {
											output: String(Number(invocation.configuration.arguments[2]) * 2)
										}
									}
								}
							}
						)
					}
				});
				fifty.verify(output).bar.is(4);
			}
		}
	//@ts-ignore
	)($api,fifty);

	export interface Client {
		command: slime.jrunscript.file.Pathname
	}

	export interface Exports {
		Client: {
			invocation: (p: {
				client: Client,
				invocation: Invocation
			}) => slime.jrunscript.shell.run.minus2.Invocation
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var subject: slime.jrunscript.tools.git.Exports = fifty.global.jsh.tools.git;

			fifty.tests.Client = {};
			fifty.tests.Client.invocation = function() {
				var fakeCommand = fifty.jsh.file.object.getRelativePath("git");
				var client = {
					command: fakeCommand
				};
				fifty.run(function status() {
					var invocation = subject.Client.invocation({
						client: client,
						invocation: {
							command: "status"
						}
					});
					fifty.verify(invocation).configuration.command.is(fakeCommand.toString());
					fifty.verify(invocation).configuration.arguments.length.is(1);
					fifty.verify(invocation).configuration.arguments[0].is("status");
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Beginning with a starting directory, attempts to locate a clone of a particular remote repository in the local
		 * filesystem by examining the URL of the `origin` remote.
		 *
		 * @experimental Considering whether to further generalize this; need to do more research into Git URL formats as well
		 * to ensure adequate handling of error conditions
		 */
		local: (p: {
			start: slime.jrunscript.file.Directory
			match: (p: slime.web.Url) => boolean
		}) => slime.jrunscript.file.Directory
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var api: { github: slime.jrunscript.tools.github.Exports } = {
				github: fifty.$loader.module("../github/module.js")
			};

			fifty.tests.sandbox = function() {
				var SLIME = fifty.jsh.file.object.getRelativePath("../../..").directory;
				if (!SLIME.getFile(".git") || !SLIME.getSubdirectory(".git")) {
					//	This test will not work on an export or other format without git metadata
					return;
				}
				var base = fifty.global.jsh.tools.git.local({
					start: fifty.jsh.file.object.getRelativePath(".").directory,
					match: api.github.isProjectUrl({ owner: "davidpcaldwell", name: "slime" })
				});
				fifty.verify(base.toString()).is(SLIME.toString());
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Context {
		program: slime.jrunscript.file.File
		api: {
			js: slime.$api.old.Exports
			java: Pick<slime.jrunscript.java.Exports,"Thread">
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			//	TODO	fix this
			Error: slime.$api.old.Exports["Error"]
			time: slime.time.Exports
			web: slime.web.Exports
		}
		environment: any
		console: any
	}

	export interface CredentialHelpers {
	}

	export interface Exports {
		Installation: (environment: {
			program: slime.jrunscript.file.File
		}) => slime.jrunscript.tools.git.Installation

		credentialHelper: CredentialHelpers
		installation: slime.jrunscript.tools.git.Installation

		//	Methods essentially copied from the default Installation
		oo: {
			daemon: slime.jrunscript.tools.git.Installation["daemon"]
			Repository: slime.jrunscript.tools.git.Installation["Repository"]
			init: slime.jrunscript.tools.git.Installation["init"]
			execute: slime.jrunscript.tools.git.Installation["execute"]
		}

		install: Function & { GUI: any }
	}

	export interface Exports {
		credentials: credentials.Exports
	}

	(function(fifty: slime.fifty.test.Kit) {
		fifty.tests.suite = function() {
			fifty.run(fifty.tests.submoduleStatusCached);
			fifty.run(fifty.tests.submoduleWithDifferentNameAndPath);
			fifty.run(fifty.tests.submoduleTrackingBranch);

			fifty.run(fifty.tests.Client.invocation);

			fifty.run(fifty.tests.Exports.program);
			fifty.run(fifty.tests.test.run);

			fifty.run(fifty.tests.sandbox);

			fifty.load("commands.fifty.ts");
			fifty.load("oo.fifty.ts");
			fifty.load("git-credential-tokens-directory.fifty.ts");
		}
	//@ts-ignore
	})(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			var subject = jsh.tools.git;

			fifty.tests.wip = function() {
				var PWD = jsh.shell.PWD.pathname.toString();
				var repository = subject.program({ command: "git" }).repository(PWD);
				var submodules = repository.gitmodules();
				jsh.shell.console(JSON.stringify(submodules,void(0),4));
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
