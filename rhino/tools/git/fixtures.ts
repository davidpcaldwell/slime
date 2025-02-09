//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git.test.fixtures {
	export type Context = void

	/**
	 * A local git repository, with a `location` indicating the repository's world-oriented location and an `api` that allows
	 * running git {@link slime.jrunscript.tools.git.Command}s.
	 */
	export type Repository = {
		location: string
		api: {
			command: exports.command.Executor
			/**
			 * Adds `user.name` and `user.email` values to the given {@link Repository}.
			 */
			configure: slime.$api.fp.impure.Process
		}
	};

	export type Exports = (fifty: slime.fifty.test.Kit) => {
		/** A Git `program` represented by the `git` available in the system path. */
		program: ReturnType<slime.jsh.Global["tools"]["git"]["program"]>

		Repository: {
			from: {
				/**
				 * Creates a new repository and initializes it, with optional settings.
				 */
				empty: (p?: { initialBranch?: string }) => Repository

				location: (p: slime.jrunscript.file.Location) => Repository
				old: (p: slime.jrunscript.tools.git.repository.Local) => Repository
			}
		}

		commands: {
			commit: slime.jrunscript.tools.git.Command<{ message: string }, void>
			config: {
				set: slime.jrunscript.tools.git.Command<{
					name: string
					value: string
				}, void>
			}
		}

		edit: (repository: Repository, path: string, change: (before: string) => string) => void
		submodule: (repository: Repository, path: string) => Repository
	}

	(
		function(
			$export: slime.loader.Export<Exports>
		) {
			$export(function(fifty: slime.fifty.test.Kit) {
				const { $api, jsh } = fifty.global;

				var program = jsh.tools.git.program({ command: "git" });

				var init: slime.jrunscript.tools.git.Command<{ initialBranch?: string },void> = {
					invocation: function(p) {
						return {
							command: "init",
							arguments: $api.Array.build(function(rv) {
								if (p && p.initialBranch) rv.push("--initial-branch", p.initialBranch);
							})
						}
					}
				}

				var config: ReturnType<Exports>["commands"]["config"] = {
					set: {
						invocation: function(p) {
							return {
								command: "config",
								arguments: $api.Array.build(function(rv) {
									rv.push(p.name);
									rv.push(p.value);
								})
							}
						}
					}
				};

				var configure = function(command: Repository["api"]["command"]) {
					command(config.set).argument({ name: "user.name", value: "SLIME" }).run();
					command(config.set).argument({ name: "user.email", value: "slime@example.com" }).run();
				}

				var Repository = function(location: slime.jrunscript.file.Location): Repository {
					var api = jsh.tools.git.program({ command: "git" }).repository(location.pathname);
					return {
						location: location.pathname,
						api: {
							command: api.command,
							configure: () => {
								configure(api.command);
							}
						}
					}
				}

				var empty: ReturnType<Exports>["Repository"]["from"]["empty"] = function(p) {
					var repository = Repository(fifty.jsh.file.temporary.directory());
					repository.api.command(init).argument(p).run();
					return repository;
				};

				function edit(repository: Repository, path: string, change: (before: string) => string) {
					var target = $api.fp.result(
						repository.location,
						function(pathname) {
							return jsh.file.Location.from.os(pathname);
						},
						jsh.file.world.Location.relative(path)
					);

					var before = $api.fp.result(
						target,
						$api.fp.pipe(
							$api.fp.world.mapping(jsh.file.world.Location.file.read.string.world()),
							$api.fp.Maybe.else(function() {
								return null as string;
							})
						)
					);

					var edited = change(before);

					var writeEdited = function(location: slime.jrunscript.file.world.Location) {
						var write = jsh.file.world.Location.file.write(location);
						$api.fp.world.now.action(write.string, { value: edited });
					}

					$api.fp.impure.now.output(target, writeEdited);
				}

				function fromOldRepository(p: slime.jrunscript.tools.git.repository.Local): slime.jrunscript.tools.git.test.fixtures.Repository {
					return Repository( p.directory.pathname.os.adapt() );
				}

				function submodule(repository: Repository, path: string): Repository {
					var at = repository.location + "/" + path;
					return Repository( jsh.file.Location.from.os(at) );
				};

				return {
					program,
					Repository: {
						from: {
							empty: empty,
							location: Repository,
							old: fromOldRepository
						}
					},
					commands: {
						commit: {
							invocation: function(p) {
								return {
									command: "commit",
									arguments: ["--message", p.message]
								}
							}
						},
						config: config
					},
					configure,
					edit,
					submodule
				};
			//@ts-ignore
			})
		}
	//@ts-ignore
	)($export);

	export type Script = slime.loader.Script<Context,Exports>
}
