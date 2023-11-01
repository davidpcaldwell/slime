//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.jsapi = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace oo {
		export interface Daemon {
			port: number
			basePath?: slime.jrunscript.file.Pathname
			kill: () => void
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
	}

	export interface Repository {
		/**
		 * A string that can be used to refer to this repository on the Git command line. See [Git
		 * URLs](https://git-scm.com/docs/git-clone#_git_urls_a_id_urls_a).
		 */
		reference: string

		clone: (argument: repository.Argument & {
			to: slime.jrunscript.file.Pathname,
			recurseSubmodules?: boolean
		}, events?: object ) => slime.jrunscript.tools.git.repository.Local
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
				/**
				 * A directory containing a local Git repository.
				 */
				directory: slime.jrunscript.file.Directory
			}

			/** @deprecated */
			export interface Local {
				/**
				 * A directory containing a local Git repository.
				 */
				local: slime.jrunscript.file.Directory
			}

			export interface Remote {
				/**
				 * A string that is compatible with the `git` command-line tool. See [Git
				 * URLs](https://git-scm.com/docs/git-clone#_git_urls_a_id_urls_a).
				 */
				remote: string
			}
		}
	}

	/**
	 * A local installation of the `git` tool.
	 */
	export interface Installation {
		daemon: (p: {
			port?: number
			basePath?: slime.jrunscript.file.Pathname
			exportAll?: boolean
		}) => oo.Daemon

		/**
		 * @returns A `Repository` of the appropriate subtype as determined by the argument.
		 */
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
					var createdLocation = internal.oo.subject.oo.init({
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

					var repository = internal.oo.subject.oo.init({
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
	)(fifty);

	export namespace repository {
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

			show: (p?: { object: string}  ) => Commit

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
			stash: {
				(): void
				list: () => any[]
			},
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
				(p?: { cached?: boolean }): oo.Submodule[]

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
						var empty = internal.oo.subject.oo.init({
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
						var empty = internal.oo.subject.oo.init({
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

						var empty = internal.oo.subject.oo.init({
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
				const { jsh } = fifty.global;

				fifty.tests.types.Repository.Local.status = function() {
					var empty = internal.oo.fixtures.Repository.from.empty({ initialBranch: "trunk" });
					var repository = internal.oo.subject.oo.Repository({ directory: jsh.file.Pathname(empty.location).directory });
					var status = repository.status();
					verify(repository).status().evaluate.property("paths").is(void(0));
					internal.oo.old.fixtures.write({
						repository: repository,
						files: {
							a: "a"
						}
					});
					verify(repository).status().paths.a.is("??");
					repository.add({ path: "a" });
					repository.config({ set: { name: "user.name", value: "SLIME unit tests" }})
					repository.config({ set: { name: "user.email", value: "slime@example.com" }})
					repository.commit({ message: "amessage" }, {
						stderr: function(e) {
							jsh.shell.console(e.detail);
						}
					});
					var status = repository.status();
					verify(status).branch.name.is("trunk");
					verify(status).branch.commit.subject.is("amessage");
					verify(status).branch.commit.names.length.is(1);
					verify(status).branch.commit.names[0].is("trunk");
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
}

namespace slime.jrunscript.tools.git.internal.oo {
	export const subject = (
		function(fifty: slime.fifty.test.Kit) {
			return fifty.global.jsh.tools.git;
		}
	//@ts-ignore
	)(fifty);

	export const fixtures = (
		function(fifty: slime.fifty.test.Kit) {
			var script: git.test.fixtures.Script = fifty.$loader.script("fixtures.ts");
			return script()(fifty);
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

	export interface Context {
		api: {
			js: slime.js.old.Exports
			java: Pick<slime.jrunscript.host.Exports,"Thread">
			shell: slime.jrunscript.shell.Exports
		}
		library: {
			log: slime.jrunscript.tools.git.internal.log.Exports
			commands: slime.jrunscript.tools.git.internal.commands.Exports
		}
		console: any
		environment: any
	}

	export interface Exports {
		Installation: new (environment: Parameters<slime.jrunscript.tools.git.Exports["Installation"]>[0] ) => slime.jrunscript.tools.git.Installation
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			//	This is from JSAPI, unclear to what it refers. It was false there; we've made it true here
			const CLONE_REGRESSION_FIXED = true;

			const fixtures = (
				function() {
					const script: slime.jrunscript.tools.git.test.fixtures.jsapi.Script = fifty.$loader.script("fixtures-jsapi.ts");
					return script();
				}
			)();

			const { remote } = fixtures;

			fifty.tests.jsapi._1 = function() {
				verify(remote).reference.is.type("string");
			}

			fifty.tests.jsapi._2 = function() {
				var to = fifty.jsh.file.object.temporary.location();

				fifty.global.jsh.shell.console("Cloning...");
				var local = remote.clone({
					to: to
				});
				fifty.global.jsh.shell.console("Cloned.");
				verify(local).reference.is.type("string");
			}

			fifty.tests.jsapi._3 = function() {
				var paths = {
					remote: fifty.jsh.file.object.temporary.directory().pathname,
					local: fifty.jsh.file.object.temporary.directory().pathname
				}
				//	TODO	note that this test currently does not do anything except create temporary directories
				if (CLONE_REGRESSION_FIXED) {
					var fromRemote = remote.clone({ to: paths.remote });
					verify(fromRemote).directory.getFile("a").read(String).evaluate(String).is("a");
					var fromLocal = fromRemote.clone({ to: paths.local });
					verify(fromLocal).directory.getFile("a").read(String).evaluate(String).is("a");
				}
			}

			fifty.tests.jsapi._4 = function() {
				var to = fifty.jsh.file.object.temporary.directory().pathname;
				to.directory.remove();
				if (CLONE_REGRESSION_FIXED) {
					var repository = remote.clone({
						to: to
					});
					var commits = repository.log();
					verify(commits).length.is(1);

					var commit = commits[0];

					var isWhen = function(p) {
						if (typeof(p) != "object") return false;
						if (p === null) return false;
						//	TODO	very dubious
						return p instanceof fifty.global.jsh.time.When;
					}

					verify(commit).commit.hash.is.type("string");
					verify(commit).author.name.is.type("string");
					verify(commit).author.email.is.type("string");
					verify(commit).author.date.evaluate.property("is").is.type("function");
					verify(commit).author.date.evaluate(isWhen).is(true);
					verify(commit).committer.name.is.type("string");
					verify(commit).committer.email.is.type("string");
					verify(commit).committer.date.evaluate.property("is").is.type("function");
					verify(commit).committer.date.evaluate(isWhen).is(true);
					verify(commit).subject.is.type("string");
				}
			};

			fifty.tests.jsapi._5 = function() {
				var location = fifty.jsh.file.object.temporary.directory().pathname;
				var repository = internal.oo.subject.oo.init({
					pathname: location
				});
				verify(repository).directory.pathname.toString().is(location.toString());
			}

			fifty.tests.jsapi._6 = function() {
				var repository = remote.clone({ to: fifty.jsh.file.object.temporary.directory().pathname });
				var before = repository.config({ arguments: ["-l"] });
				verify(before).evaluate.property("user.name").is(void(0));
				verify(before).evaluate.property("user.email").is(void(0));
				repository.config({ arguments: ["--add", "user.name", "Name!" ]});
				repository.config({ arguments: ["--add", "user.email", "test@example.com" ]});
				var after = repository.config({ arguments: ["-l"] });
				verify(after).evaluate.property("user.name").is("Name!");
				verify(after).evaluate.property("user.email").is("test@example.com");
			};

			const newRepository = function(): repository.Local & { test?: { writeFile: (path: string, content: string) => void } } {
				var tmpdir = fifty.jsh.file.object.temporary.directory();
				var repository = fixtures.old.init({
					pathname: tmpdir.pathname
				});
				var rv: ReturnType<typeof newRepository> = repository;
				rv.test = {
					writeFile: function(path,content) {
						repository.directory.getRelativePath(path).write(content, { append: false });
					}
				};
				return rv;
			};

			// scope.writeFile = function(repository,path,content) {
			// 	repository.test.writeFile(path,content);
			// };

			fifty.tests.jsapi._7 = function() {
				var repository = newRepository();
				repository.test.writeFile("a","a");
				repository.add({ path: "a" });
				verify(repository).status().paths.evaluate.property("a").is("A ");
			};

			fifty.tests.jsapi._8 = function() {
				var tmp = fifty.jsh.file.object.temporary.directory().pathname;
				tmp.directory.remove();
				var local = remote.clone({ to: tmp });
				var origin = local.remote.getUrl({ name: "origin" });
				verify(origin).is(remote.reference);
			};

			const remotes = fifty.jsh.file.object.temporary.directory();

			const daemon = internal.oo.subject.oo.daemon({
				port: fifty.global.jsh.ip.getEphemeralPort().number,
				basePath: remotes.pathname,
				exportAll: true
			});


			const child = (
				function() {
					var child = remotes.getRelativePath("child").createDirectory();
					child.getRelativePath("b").write("b", { append: false });
					var childRepository = fixtures.old.init({ pathname: child.pathname });
					childRepository.add({ path: "b" });
					childRepository.commit({
						all: true,
						message: "child b"
					});
					var childRemote = internal.oo.subject.oo.Repository({ remote: "git://127.0.0.1:" + daemon.port + "/child" });
					return childRemote;
				}
			)();

			fifty.tests.jsapi._9 = function() {
				var tmp = fifty.jsh.file.object.temporary.directory().pathname;
				tmp.directory.remove();
				var local = remote.clone({
					to: tmp
				});
				local.execute({
					command: "submodule",
					arguments: [
						"add",
						child.reference
					]
				});
				local.execute({
					command: "submodule",
					arguments: [
						"update",
						"--init", "--recursive"
					]
				});
				verify(local).directory.getFile("a").is.type("object");
				verify(local).directory.getFile("child/a").is.type("null");
				verify(local).directory.getFile("child/b").is.type("object");
				var submodules = local.submodule();
				verify(submodules).length.is(1);
				verify(submodules)[0].path.is("child");
				verify(submodules)[0].repository.remote.getUrl({ name: "origin" }).is(child.reference);
				verify(submodules)[0].commit.is.type("object");
				verify(submodules)[0].commit.commit.hash.is.type("string");
				verify(submodules)[0].commit.subject.is("child b");
			}

			fifty.tests.jsapi._10 = function() {
				var tmp = fifty.jsh.file.object.temporary.location();
				var local = remote.clone({ to: tmp });
				var sub = local.submodule.add({ repository: child, path: "sub" });
				verify(sub).directory.pathname.toString().is(tmp.directory.getRelativePath("sub").toString());
				verify(sub.remote.getUrl({ name: "origin" })).is(child.reference);
			}

			fifty.tests.jsapi._11 = function() {
				var parent = fixtures.fixtures.repository.remote({
					name: "fetch-parent",
					files: {
						a: "a"
					}
				});
				var child = fixtures.fixtures.repository.remote({
					name: "fetch-child",
					files: {
						b: "b"
					}
				});

				var local = {
					parent: parent.remote.clone({
						to: fifty.jsh.file.object.temporary.directory().pathname
					})
				};

				local.parent.config({
					arguments: [
						"submodule.recurse", "true"
					]
				});

				parent.server.submodule.add({
					path: "child",
					repository: child.remote
				});
				parent.server.commit({ all: true, message: "add submodule" });

				var status = local.parent.status();
				const MAIN_BRANCH = status.branch.name;

				local.parent.fetch({ all: true });
				local.parent.merge({ name: "origin/" + MAIN_BRANCH });
				local.parent.submodule.update({ init: true, recursive: true });

				child.server.directory.getRelativePath("add").write("add", { append: false });
				child.server.add({ path: "add" });
				child.server.commit({ message: "add file to child" });

				local.parent.fetch({ all: true });
			};

			const writeFile = function(repository,path,content) {
				repository.test.writeFile(path,content);
			};

			fifty.tests.jsapi._12 = function() {
				var repository = newRepository();

				writeFile(repository,"start","start");
				repository.add({ path: "start" });
				repository.commit({ message: "start" });

				repository.branch({ name: "a" });
				repository.branch({ name: "b" });
				repository.checkout({ branch: "a" });

				var commit = repository.show();
				verify(commit,"commit").is(commit);
				writeFile(repository,"a","a");
				repository.add({ path: "a" });
				repository.commit({ message: "a" });

				verify(repository).directory.getFile("a").is.type("object");
				repository.checkout({ branch: "b" });
				verify(repository).directory.getFile("a").is.type("null");
			};

			fifty.tests.jsapi._13 = function() {
				var hasBranch = function(branch) {
					var rv = function(p) {
						for (var i=0; i<p.length; i++) {
							if (p[i].name == branch.name && p[i].current == branch.current) return true;
						}
						return false;
					};
					rv.toString = function() {
						return "hasBranch: name=" + branch.name + " current=" + branch.current;
					};
					return rv;
				};

				var origin = fixtures.fixtures.repository.local({
					files: {
						a: "a"
					}
				});

				var MAIN = (function(origin: repository.Local) {
					var status = origin.status();
					return status.branch.name;
				})(origin);

				var repository = origin.clone({ to: fifty.jsh.file.object.temporary.location() });

				repository.branch({ name: "a" });
				repository.branch({ name: "b" });

				//	TODO	untested: startPoint property
				//	TODO	untested: force property

				var branches = repository.branch();

				verify(branches).length.is(3);

				verify(branches).evaluate(hasBranch({ current: false, name: "b" })).is(true);
				verify(branches).evaluate(hasBranch({ current: false, name: "a" })).is(true);
				verify(branches).evaluate(hasBranch({ current: true, name: MAIN })).is(true);
				verify(branches).evaluate(hasBranch({ current: false, name: "foo" })).is(false);

				var all = repository.branch({ all: true });
				verify(all).length.is(4);
				verify(all).evaluate(hasBranch({ current: false, name: "remotes/origin/" + MAIN })).is(true);

				var remotes = repository.branch({ remote: true });
				verify(remotes).length.is(1);
				remotes.forEach(function(branch) {
					fifty.global.jsh.shell.console(JSON.stringify(branch));
				})
				verify(remotes).evaluate(hasBranch({ current: false, name: "origin/" + MAIN })).is(true);

				//	TODO	untested: delete current branch; delete --force

				repository.branch({ delete: "a" });
				var afterDelete = repository.branch();
				verify(afterDelete).length.is(2);
				verify(afterDelete).evaluate(hasBranch({ current: false, name: "b" })).is(true);
				verify(afterDelete).evaluate(hasBranch({ current: false, name: "a" })).is(false);
				verify(afterDelete).evaluate(hasBranch({ current: true, name: MAIN })).is(true);

				//	TODO	untested: old form

				//	ensure name of detached branch is null
				var commit = repository.log()[0];
				repository.checkout({ branch: commit.commit.hash });
				var list = repository.branch();
				verify(list).length.is(3);
				verify(list).evaluate(hasBranch({ current: true, name: null })).is(true);
				verify(list).evaluate(hasBranch({ current: false, name: MAIN })).is(true);
				verify(list).evaluate(hasBranch({ current: false, name: "a" })).is(false);
				verify(list).evaluate(hasBranch({ current: false, name: "b" })).is(true);
				verify(list).evaluate(hasBranch({ current: false, name: "c" })).is(false);
			};

			fifty.tests.jsapi._14 = function() {
				var repository = newRepository();
				repository.test.writeFile("a", "a");
				repository.add({ path: "a" });
				repository.commit({ message: "message a" });
				repository.branch({ name: "a" });
				repository.branch({ name: "b" });
				repository.checkout({ branch: "b" });
				repository.test.writeFile("b", "b");
				repository.add({ path: "b" });
				repository.commit({ message: "message b" });

				var branches = repository.branch();
				var a = branches.filter(function(branch) {
					return branch.name == "a";
				})[0];
				var b = branches.filter(function(branch) {
					return branch.name == "b";
				})[0];
				verify(a).commit.commit.hash.is.type("string");
				verify(b).commit.commit.hash.is.type("string");
				verify(a).commit.commit.hash.is.not(b.commit.commit.hash);
				fifty.global.jsh.shell.console(repository.directory.toString());
			};

			fifty.tests.jsapi._15 = function() {
				var repository = newRepository();
				var MAIN = repository.status().branch.name;
				repository.test.writeFile("a", "a");
				repository.add({ path: "a" });
				repository.commit({ message: "message a" });
				var a = repository.show({ object: MAIN });
				repository.checkout({ branch: a.commit.hash });
				var branch = repository.branch().filter(function(b) {
					return b.current;
				})[0];
				verify(branch).name.is(null);
			};

			fifty.tests.jsapi._16 = function() {
				var repository = newRepository();

				repository.test.writeFile("a","a");
				repository.add({ path: "a" });
				repository.commit({ message: "a" });
				repository.branch({ name: "a" });

				repository.branch({ name: "b" });
				repository.checkout({ branch: "b" });
				repository.test.writeFile("b","b");
				repository.add({ path: "b" });
				repository.commit({ message: "b" });

				repository.checkout({ branch: "a" });
				repository.branch({ name: "c" });
				repository.checkout({ branch: "c" });
				repository.test.writeFile("c","c");
				repository.add({ path: "c" });
				repository.commit({ message: "c" });

				var mergeBase = repository.mergeBase({ commits: ["b","c"] });
				var a = repository.show({ object: "a" });
				verify(a).commit.hash.is(mergeBase.commit.hash);
			};

			fifty.tests.jsapi._17 = function() {
				var tmpdir = fifty.jsh.file.object.temporary.directory();
				var repository = old.fixtures.init({
					pathname: tmpdir.pathname
				});
				repository.directory.getRelativePath("a").write("a", { append: false });
				repository.add({ path: "a" });
				repository.commit({ message: "a" });
				repository.directory.getRelativePath("b").write("b", { append: false });
				repository.add({ path: "b" });
				verify(repository.stash.list()).length.is(0);
				repository.stash();
				repository.directory.getRelativePath("c").write("c", { append: false });
				repository.add({ path: "c" });
				repository.stash();
				verify(repository.stash.list()).length.is(2);
			};

			fifty.tests.jsapi._18 = function() {
				var tmpdir = fifty.jsh.file.object.temporary.directory();
				var repository = old.fixtures.init({
					pathname: tmpdir.pathname
				});
				repository.directory.getRelativePath("a").write("a", { append: false });
				verify(repository.status()).paths.a.is("??");
				repository.add({ path: "a" });
				fifty.global.jsh.shell.echo(JSON.stringify(repository.status()));
				verify(repository.status()).paths.a.is("A ");
				repository.commit({ message: "a" });
				verify(repository.status()).evaluate.property("paths").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Installation.init);
				fifty.run(fifty.tests.types.Repository.Local.config);
				fifty.run(fifty.tests.types.Repository.Local.status);

				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
