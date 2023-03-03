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
		}
	};

	export type Exports = (fifty: slime.fifty.test.Kit) => {
		Repository: {
			from: {
				old: (p: slime.jrunscript.tools.git.repository.Local) => Repository
			}
		}
		commands: {
			commit: slime.jrunscript.tools.git.Command<{ message: string }, void>
		}
		program: ReturnType<slime.jsh.Global["tools"]["git"]["program"]>
		empty: (p?: { initialBranch?: string }) => Repository
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

				var empty: ReturnType<Exports>["empty"] = function(p) {
					var tmp = fifty.jsh.file.temporary.directory();
					var repository = jsh.tools.git.program({ command: "git" }).repository(tmp.pathname);
					repository.command(init).argument(p).run();
					return {
						location: tmp.pathname,
						api: repository
					}
				}

				function edit(repository: Repository, path: string, change: (before: string) => string) {
					var target = $api.fp.result(
						repository.location,
						function(pathname) {
							return jsh.file.world.Location.from.os(pathname);
						},
						jsh.file.world.Location.relative(path)
					);

					var before = $api.fp.result(
						target,
						$api.fp.pipe(
							$api.fp.world.mapping(jsh.file.world.Location.file.read.string()),
							$api.fp.Maybe.else(function() {
								return null as string;
							})
						)
					);

					var edited = change(before);

					var writeEdited = $api.fp.world.output(jsh.file.world.Location.file.write.string({ value: edited }));

					$api.fp.impure.now.output(target, writeEdited);
				}

				function fromOldRepository(p: slime.jrunscript.tools.git.repository.Local): slime.jrunscript.tools.git.test.fixtures.Repository {
					return {
						location: p.directory.toString(),
						api: jsh.tools.git.program({ command: "git" }).repository(p.directory.toString())
					}
				}

				function submodule(repository: Repository, path: string): Repository {
					var at = repository.location + "/" + path;
					return {
						location: at,
						api: jsh.tools.git.program({ command: "git" }).repository(at)
					};
				};

				return {
					Repository: {
						from: {
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
						}
					},
					program,
					empty,
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
