//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git {
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
					var createdLocation = internal.oo.subject.init({
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

					var repository = internal.oo.subject.init({
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
						var empty = internal.oo.subject.init({
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
						var empty = internal.oo.subject.init({
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

						var empty = internal.oo.subject.init({
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
					var repository = internal.oo.subject.Repository({ directory: jsh.file.Pathname(empty.location).directory });
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

	export interface Context {
		api: {
			js: slime.js.old.Exports
			java: slime.jrunscript.host.Exports
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
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Installation.init);
				fifty.run(fifty.tests.types.Repository.Local.config);
				fifty.run(fifty.tests.types.Repository.Local.status);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
