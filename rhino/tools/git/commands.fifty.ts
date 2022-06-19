//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git.internal.commands {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.world = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace test {
		export type Repository = {
			location: slime.jrunscript.file.world.Location
			api: ReturnType<ReturnType<slime.jrunscript.tools.git.Exports["program"]>["repository"]>
		};

		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			const { $api, jsh } = fifty.global;

			var program = jsh.tools.git.program({ command: "git" });

			var init: slime.jrunscript.tools.git.Command<void,void> = {
				invocation: function(p) {
					return {
						command: "init"
					}
				}
			}

			function empty(): Repository {
				var tmp = fifty.jsh.file.temporary.directory();
				var repository = jsh.tools.git.program({ command: "git" }).repository(tmp.pathname);
				repository.command(init).argument().run();
				return {
					location: tmp,
					api: repository
				}
			}

			function edit(repository: Repository, path: string, change: (before: string) => string) {
				var target = $api.Function.result(
					repository.location,
					jsh.file.world.Location.relative(path)
				);

				var before = $api.Function.result(
					target,
					$api.Function.pipe(
						jsh.file.world.Location.file.read.string(),
						$api.Function.world.handler.ask(),
						$api.Function.world.input,
						$api.Function.Maybe.else(function() {
							return null as string;
						})
					)
				);

				var edited = change(before);

				var process = $api.Function.result(
					target,
					$api.Function.pipe(
						jsh.file.world.Location.file.write.string({ value: edited }),
						$api.Function.world.handler.tell()
					)
				);

				$api.Function.world.process(process);
			}

			return {
				program,
				empty,
				edit
			};
		//@ts-ignore
		})(fifty);
	}
}

namespace slime.jrunscript.tools.git {
	export interface Commands {
		status: Command<void,command.status.Result>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const subject = jsh.tools.git.commands;
			const fixtures = internal.commands.test.fixtures;

			const add: slime.jrunscript.tools.git.Command<string,void> = {
				invocation: function(p) {
					return {
						command: "add",
						arguments: [p]
					}
				}
			};

			fifty.tests.exports.status = {};

			fifty.tests.exports.status.uninitialized = function() {
				var directory = fifty.jsh.file.temporary.directory();

				var command = fixtures.program.repository(directory.pathname).command(subject.status).argument();
				verify(command).evaluate(function(command) { return command.run(); }).threw.type(Error);
			};

			fifty.tests.exports.status.empty = function() {
				var it = fixtures.empty();
				jsh.shell.console(it.toString());

				var status = it.api.command(subject.status).argument().run();
				verify(status).branch.is("master");
				verify(status).evaluate.property("paths").is(void(0));
			};

			/**
			 * Verifies the behavior of various operations that affect the git staging area.
			 */
			fifty.tests.world.staging = function() {
				var commit: slime.jrunscript.tools.git.Command<{
					message: string
				},void> = {
					invocation: function(p) {
						return {
							command: "commit",
							arguments: $api.Array.build(function(rv) {
								rv.push("--message", p.message);
							})
						}
					}
				};

				var reset: slime.jrunscript.tools.git.Command<void,void> = {
					invocation: function(p) {
						return {
							command: "reset"
						}
					}
				};

				function status() {
					return it.api.command(jsh.tools.git.commands.status).argument().run();
				}

				var it = fixtures.empty();
				fixtures.edit(it, "a", $api.Function.returning("a"));
				fixtures.edit(it, "b", $api.Function.returning("b"));
				it.api.command(add).argument("a").run();
				verify(status(), "status", function(it) {
					it.paths.a.is("A ");
					it.paths.b.is("??");
				});
				it.api.command(add).argument("b").run();
				it.api.command(commit).argument({ message: "1" }).run();
				fixtures.edit(it, "a", $api.Function.returning("aa"));
				fixtures.edit(it, "b", $api.Function.returning("bb"));
				verify(status(), "status_after_edits", function(it) {
					it.paths.a.is(" M");
					it.paths.b.is(" M");
				});
				it.api.command(add).argument("a").run();
				verify(status(), "status_after_add_a", function(it) {
					it.paths.a.is("M ");
					it.paths.b.is(" M");
				});
				it.api.command(reset).argument().run();
				verify(status(), "status_after_reset", function(it) {
					it.paths.a.is(" M");
					it.paths.b.is(" M");
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Commands {
		fetch: Command<void,void>
	}

	export interface Commands {
		merge: Command<{ name: string }, void>
	}

	export interface Commands {
		submodule: {
			update: Command<void,void>
		}
	}
}

namespace slime.jrunscript.tools.git.internal.commands {
	export interface Context {
	}

	export interface Exports extends slime.jrunscript.tools.git.Commands {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
