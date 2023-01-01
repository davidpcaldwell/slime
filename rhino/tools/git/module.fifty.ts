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
 */
namespace slime.jrunscript.tools.git {
	export interface Commit {
		names: string[],
		commit: { hash: string },
		author: { name: string, email: string, date: any },
		committer: { name: string, email: string, date: any },
		subject: string
	}

	export interface Branch {
		/**
		 * The name of this branch. Can be `null` if this "branch" is a detached HEAD.
		 */
		name: string
		current: boolean
		commit: Commit
	}

	interface Daemon {
		port: number
		basePath?: slime.jrunscript.file.Pathname
		kill: () => void
	}

	export interface Installation {
		daemon: (p: {
			port?: number
			basePath?: slime.jrunscript.file.Pathname
			exportAll?: boolean
		}) => Daemon

		Repository: {
			(p: repository.argument.Directory): slime.jrunscript.tools.git.repository.Local
			new (p: repository.argument.Directory): slime.jrunscript.tools.git.repository.Local
			(p: repository.argument.Local): slime.jrunscript.tools.git.repository.Local
			new (p: repository.argument.Local): slime.jrunscript.tools.git.repository.Local
			(p: repository.argument.Remote): slime.jrunscript.tools.git.Repository
			new (p: repository.argument.Remote): slime.jrunscript.tools.git.Repository
		}

		//	Uses Object.assign for rhino/shell run(), so should cross-check with those arguments
		execute: (m: {
			config?: any
			command: string,
			arguments?: string[]
			environment?: any
			directory?: slime.jrunscript.file.Directory
		}) => void
	}

	export interface Repository {
		reference: string
		clone: (argument: repository.Argument & {
			to: slime.jrunscript.file.Pathname,
			recurseSubmodules?: boolean
		}, events?: object ) => slime.jrunscript.tools.git.repository.Local
	}

	export interface Submodule {
		/**
		 * The logical name of the submodule, as it is referenced in configuration entries.
		 */
		name: string

		/**
		 * The path of the submodule within its parent.
		 */
		path: string

		/**
		 * The branch the submodule is set up to track, if it is set up to track one.
		 */
		branch?: string

		repository: repository.Local
		commit: Commit
	}

	export namespace repository {
		export interface Argument {
			config?: { [x: string]: string }
			credentialHelper?: string
			credentialHelpers?: string[]
			directory?: slime.jrunscript.file.Directory
		}

		export namespace argument {
			export interface Directory {
				directory: slime.jrunscript.file.Directory
			}

			/** @deprecated */
			export interface Local {
				local: slime.jrunscript.file.Directory
			}

			export interface Remote {
				remote: string
			}
		}

		export interface Local extends slime.jrunscript.tools.git.Repository {
			directory: slime.jrunscript.file.Directory

			add: any
			rm: (p: { path: string }, events?: $api.event.Function.Receiver) => void

			branch: {
				(p: {
					delete: string
					force?: boolean
				}): void

				(p?: {
					remotes?: boolean
					/** @deprecated */
					remote?: boolean
					all?: boolean
				}): slime.jrunscript.tools.git.Branch[]

				(p: {
					old: boolean
				}): slime.jrunscript.tools.git.Branch

				(p: {
					name: string
					startPoint?: string
					force?: boolean
				}): void
			}

			show: (p: { object: string}  ) => Commit

			fetch: (p: Argument & {
				all?: boolean
				prune?: boolean
				recurseSubmodules?: boolean
				stdio?: any
			}, events?: $api.event.Function.Receiver) => void

			merge: (p: {
				name: string
				noCommit?: boolean
				noFf?: boolean
				ffOnly?: boolean
				stdio?: any
			}) => void

			checkout: (p: { branch: string, stdio?: any  }) => void

			remote: ( () => void ) & { getUrl: (p: { name: string }) => string },
			stash: any,
			push: (p?: {
				delete?: boolean
				setUpstream?: string
				all?: boolean
				repository?: string
				refspec?: string

				config?: any
				environment?: any
			}) => void,
			mergeBase: (p: { commits: string[] }) => Commit
			submodule: {
				/**
				 * Returns a list of submodules for this repository.
				 */
				(p?: { cached?: boolean }): Submodule[]

				add: (p: {
					config?: { [name: string]: string }
					repository: slime.jrunscript.tools.git.Repository
					path: string
					name?: string
					branch?: string
				}, events?: any) => slime.jrunscript.tools.git.repository.Local

				update: (p: Argument & {
					init?: boolean,
					recursive?: boolean
				}) => void

				deinit: (p: Argument & {
					force?: boolean
					path: string
				}) => void
			}

			execute: (p: {
				command: string
				arguments?: string[]
				environment?: object,
				directory?: slime.jrunscript.file.Directory
			}) => any

			commit: (p: {
				all?: boolean
				noVerify?: boolean
				message: string
				author?: string
			}, events?: any) => any
		}
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
				init: slime.jrunscript.tools.git.Exports["init"]
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
					return fifty.$loader.file("fixtures-old.js", { module: subject });
				}
			//@ts-ignore
			)(fifty);
		}
	}


	export interface Installation {
		/**
		 * Creates a new repository at the given location (see `git init`).
		 *
		 * @returns The local repository created.
		 */
		init: (
			p: {
				/**
				 * A location at which to create an empty repository.
				 */
				pathname: slime.jrunscript.file.Pathname
			},
			events?: {
				stdout: slime.$api.event.Handler<string>
				stderr: slime.$api.event.Handler<string>
			}
		) => slime.jrunscript.tools.git.repository.Local
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var verify = fifty.verify;

			var fixture = {
				write: function(o) {
					var directory = (function() {
						if (o.repository) return o.repository.directory;
						if (o.directory) return o.directory;
					})();
					for (var x in o.files) {
						//	TODO	add function form which receives string as argument
						directory.getRelativePath(x).write(o.files[x], { append: false });
					}
				}
			};

			fifty.tests.Installation = {};
			fifty.tests.Installation.init = function() {
				var verifyEmptyRepository = function(repository: slime.jrunscript.tools.git.repository.Local) {
					verify(repository).is.type("object");
					verify(repository).log().length.is(0);
				};

				fifty.run(function worksWhenCreatingDirectory() {
					var location = fifty.jsh.file.object.temporary.location();
					verify(location).directory.is(null);
					var createdLocation = internal.subject.init({
						pathname: location
					});
					verify(location).directory.is.type("object");
					verifyEmptyRepository(createdLocation);
				});

				fifty.run(function worksWithEmptyDirectory() {
					const $api = fifty.global.$api;
					var directory = fifty.jsh.file.object.temporary.directory();

					fixture.write({
						directory: directory,
						files: {
							"a": "a"
						}
					});

					type template = { stdout: string, stderr: string };
					var events: template = { stdout: "a", stderr: "a" };

					var captor = fifty.$api.Events.Captor(events);

					var isType = function(type: string): slime.$api.fp.Predicate<slime.$api.Event<any>> {
						return $api.fp.pipe(
							$api.fp.property("type"),
							$api.fp.Predicate.is(type)
						);
					};

					var ofType = function(type: string) {
						return $api.fp.Array.filter(isType(type));
					}

					var handler = captor.handler;

					var repository = internal.subject.init({
						pathname: directory.pathname
					}, handler);

					verifyEmptyRepository(repository);
					verify(repository).directory.getFile("a").is.type("object");

					verify(captor).events.evaluate(ofType("stdout")).length.is(2);
					var event: $api.Event<string> = ofType("stdout")(captor.events)[1];
					verify(event).detail.evaluate(function(p) { return String(p); }).is("");
				});
			};
		}
	//@ts-ignore
	)(fifty)

	export namespace repository {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.types.Repository = {};
				fifty.tests.types.Repository.Local = {};
			}
		//@ts-ignore
		)(fifty);

		export interface Local {
			log: (p?: {
				author?: string
				all?: boolean
				revisionRange?: string
				/**
				 * @deprecated
				 */
				range?: string
			}) => Commit[]
		}

		export interface Local {
			config: {
				(p: {
					set: {
						name: string
						value: string
					}
				}): void

				(p: {
					list: {
						fileOption?: "system" | "global" | "local" | "worktree" | { file: string }
						showOrigin?: boolean
						//	TODO	--show-scope not supported on macOS Big Sur
						//	--null might make sense as an implementation detail, should investigate
						//	--name-only probably does not ever make sense; would make value optional if it did
					}
				}): {
					/**
					 * Present only if `showOrigin` was `true`.
					 */
					origin?: string
					name: string
					value: string
				}[]

				(p: { arguments: string[] }): { [x: string]: string }
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.types.Repository = {};
				fifty.tests.types.Repository.Local = {};
				fifty.tests.types.Repository.Local.config = function() {
					fifty.run(function old() {
						var empty = internal.subject.init({
							pathname: fifty.jsh.file.object.temporary.location()
						});
						var old = empty.config({
							arguments: ["--list", "--local"]
						});
						fifty.verify(old).evaluate.property("foo.bar").is(void(0));

						fifty.global.jsh.shell.run({
							command: "git",
							arguments: ["config", "foo.bar", "baz"],
							directory: empty.directory
						});
						var after = empty.config({
							arguments: ["--list", "--local"]
						});
						fifty.verify( Object.keys(after).length - Object.keys(old).length ).is(1);
						fifty.verify(after).evaluate.property("foo.bar").is("baz");
					});

					fifty.run(function list() {
						var empty = internal.subject.init({
							pathname: fifty.jsh.file.object.temporary.location()
						});
						var local = empty.config({
							list: {
								fileOption: "local"
							}
						});
						fifty.verify(local)[0].name.is.type("string");
						fifty.verify(local)[0].value.is.type("string");
						//	TODO	should verify there's no value with empty string for name
						fifty.verify(local).evaluate(function(p) {
							return p.some(function(value) {
								return !Boolean(value.name);
							})
						}).is(false);
					});

					fifty.run(function set() {
						var getConfigObject = function(repository) {
							return repository.config({
								list: {
									fileOption: "local"
								}
							}).reduce(function(rv,entry) {
								rv[entry.name] = entry.value;
								return rv;
							}, {});
						}

						var empty = internal.subject.init({
							pathname: fifty.jsh.file.object.temporary.location()
						});
						fifty.verify(empty).evaluate(getConfigObject).evaluate.property("foo.bar").is(void(0));

						empty.config({
							set: {
								name: "foo.bar",
								value: "baz"
							}
						});
						fifty.verify(empty).evaluate(getConfigObject).evaluate.property("foo.bar").is("baz");
					});
				}
			}
		//@ts-ignore
		)(fifty)

		export interface Local {
			status: () => {
				/**
				 * The current checked out branch. Note that the `name` of the branch will be `null` if a detached HEAD is checked
				 * out.
				 */
				branch: Branch

				/**
				 * An object whose keys are string paths within the repository, and whose values are the two-letter output
				 * of the `git status --porcelain` command. This property is absent if no files have a status.
				 */
				paths?: { [path: string]: string }
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var verify = fifty.verify;

				fifty.tests.types.Repository.Local.status = function() {
					var at = fifty.jsh.file.object.temporary.location();
					var repository = internal.old.fixtures.init({ pathname: at });
					debugger;
					var status = repository.status();
					verify(repository).status().evaluate.property("paths").is(void(0));
					internal.old.fixtures.write({
						repository: repository,
						files: {
							a: "a"
						}
					});
					verify(repository).status().paths.a.is("??");
					repository.add({ path: "a" });
					repository.commit({ message: "amessage" });
					var status = repository.status();
					verify(status).branch.name.is("master");
					verify(status).branch.commit.subject.is("amessage");
					verify(status).branch.commit.names.length.is(1);
					verify(status).branch.commit.names[0].is("master");
					fifty.global.jsh.shell.console(JSON.stringify(status,void(0),4));

					fifty.run(function detachedHeadBranchNameIsNull() {
						var hash = status.branch.commit.commit.hash;
						repository.checkout({ branch: hash });
						var detached = repository.status();
						verify(detached).branch.name.is(null);
					});
				}
			}
		//@ts-ignore
		)(fifty);
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

				var library = internal.subject.init({ pathname: tmpdir.getRelativePath("sub") });
				configure(library);
				commitFile(library, "b");

				var parent = internal.subject.init({ pathname: tmpdir.getRelativePath("parent") });
				configure(parent);
				commitFile(parent, "a");

				return { library, parent };
			}

			run(function trackingMaster() {
				const { parent, library } = initialize();
				const submodule = parent.submodule.add({ repository: library, path: "path/sub", name: "sub", branch: "master" });
				configure(submodule);
				parent.commit({ all: true, message: "add submodule"});
				var submodules = parent.submodule();
				verify(submodules)[0].branch.is("master");
			});

			run(function trackingNothing() {
				const { parent, library } = initialize();
				const submodule = parent.submodule.add({ repository: library, path: "path/sub", name: "sub" });
				configure(submodule);
				parent.commit({ all: true, message: "add submodule"});
				var submodules = parent.submodule();
				verify(submodules)[0].evaluate.property("branch").is(void(0));
			});
		}

		fifty.tests.submoduleWithDifferentNameAndPath = function() {
			var tmpdir = fifty.jsh.file.object.temporary.directory();
			var sub = internal.subject.init({ pathname: tmpdir.getRelativePath("sub") });
			configure(sub);
			commitFile(sub, "b");
			var parent = internal.subject.init({ pathname: tmpdir.getRelativePath("parent") });
			configure(parent);
			commitFile(parent, "a");

			var added = parent.submodule.add({ repository: sub, path: "path/sub", name: "sub", branch: "master" });

			var submodules = parent.submodule();
			verify(submodules).length.is(1);
			verify(submodules)[0].evaluate.property("name").is("sub");
			verify(submodules)[0].path.is("path/sub");
			verify(submodules)[0].repository.reference.is(added.reference);
			verify(submodules)[0].evaluate.property("branch").is("master");
			verify(submodules)[0].commit.subject.is("b");
			//	don't bother testing other fields of commit
		};

		fifty.tests.submoduleStatusCached = function() {
			var tmpdir = fifty.jsh.file.object.temporary.directory();

			var library = internal.subject.init({ pathname: tmpdir.getRelativePath("sub") });
			configure(library);
			commitFile(library, "b");
			var branch = library.status().branch;

			var parent = internal.subject.init({ pathname: tmpdir.getRelativePath("parent") });
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

	export interface Command<P,R> {
		invocation: (parameter: P) => Invocation

		/**
		 * Converts the command output into the declared result type. If absent, an implementation that returns `undefined` will
		 * be provided.
		 */
		result?: (output: string) => R
	}

	export namespace command.status {
		export interface Result {
			/**
			 * The current checked out branch, or `null` if a detached HEAD is checked out.
			 */
			branch: string

			entries: {
				code: string
				path: string
				orig_path?: string
			}[]

			/**
			 * @deprecated Replaced by the `entries` property, which properly captures rename entries.
			 *
			 * An object whose keys are string paths within the repository, and whose values are the two-letter output
			 * of the `git status --porcelain` command. This property is absent if no files have a status.
			 */
			paths?: { [path: string]: string }
		}

		export namespace old {
			export type Result = Pick<command.status.Result,"branch" | "paths">
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
				run: (invocation: slime.jrunscript.shell.run.Invocation) => slime.$api.fp.world.old.Tell<slime.jrunscript.shell.run.TellEvents>
			}
		}
	}

	export namespace exports {
		export namespace command {
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
		program: (program: Program) => {
			Invocation: <P,R>(p: {
				pathname?: string
				command: slime.jrunscript.tools.git.Command<P,R>
				argument: P
			}) => world.Invocation<P,R>

			repository: (pathname: string) => {
				Invocation: <P,R>(p: {
					command: slime.jrunscript.tools.git.Command<P,R>
					argument: P
				}) => world.Invocation<P,R>

				shell: (p: {
					invocation: slime.jrunscript.tools.git.Invocation
					stdio: slime.jrunscript.shell.invocation.Argument["stdio"]
				}) => shell.run.Invocation

				command: exports.command.Executor

				run: <P,R>(p: {
					command: slime.jrunscript.tools.git.Command<P,R>
					input: P
					world?: world.Invocation<P,R>["world"]
				}) => R
			}

			config: (values: { [name: string]: string }) => {
				repository: (pathname: string) => {
					command: exports.command.Executor
				}
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
					var invocation: shell.run.Invocation;
					executor.run({
						world: {
							run: function(created: shell.run.Invocation) {
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

					var invoked: shell.run.Invocation;
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
			}) => shell.run.Invocation
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
			}) => slime.jrunscript.shell.run.Invocation
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
			js: any
			java: any
			shell: slime.jrunscript.shell.Exports
			Error: any
			time: slime.time.Exports
			web: slime.web.Exports
		}
		environment: any
		console: any
	}

	export interface Exports {
		Installation: (environment: {
			program: slime.jrunscript.file.File
		}) => slime.jrunscript.tools.git.Installation

		credentialHelper: any
		installation: slime.jrunscript.tools.git.Installation
		daemon: slime.jrunscript.tools.git.Installation["daemon"]
		Repository: slime.jrunscript.tools.git.Installation["Repository"]
		init: slime.jrunscript.tools.git.Installation["init"]
		execute: slime.jrunscript.tools.git.Installation["execute"]
		install: Function & { GUI: any }
	}

	(function(fifty: slime.fifty.test.Kit) {
		fifty.tests.suite = function() {
			fifty.run(fifty.tests.Installation.init);
			fifty.run(fifty.tests.types.Repository.Local.config);
			fifty.run(fifty.tests.types.Repository.Local.status);
			fifty.run(fifty.tests.submoduleStatusCached);
			fifty.run(fifty.tests.submoduleWithDifferentNameAndPath);
			fifty.run(fifty.tests.submoduleTrackingBranch);

			fifty.run(fifty.tests.Client.invocation);

			fifty.run(fifty.tests.Exports.program);
			fifty.run(fifty.tests.test.run);

			fifty.run(fifty.tests.sandbox);
		}
	//@ts-ignore
	})(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
