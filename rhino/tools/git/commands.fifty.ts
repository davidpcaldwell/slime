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
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace test {
		export type Repository = {
			location: slime.jrunscript.file.world.Location
			api: ReturnType<ReturnType<slime.jrunscript.tools.git.Exports["program"]>["repository"]>
		};

		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			const script: slime.jrunscript.tools.git.test.fixtures.Script = fifty.$loader.script("fixtures.ts");
			var setup = script();
			return setup(fifty);
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

			var rename: slime.jrunscript.tools.git.Command<{ from: string, to: string },void> = {
				invocation: function(p) {
					return {
						command: "mv",
						arguments: [p.from, p.to]
					}
				}
			};

			fifty.tests.exports.status.rename = function() {
				var it = fixtures.empty();

				fixtures.edit(it, "a", function(before) { return "a"; });
				it.api.command(add).argument("a").run();
				it.api.command(commit).argument({ message: "a" }).run();

				it.api.command(rename).argument({ from: "a", to: "b" }).run();

				var status = it.api.command(jsh.tools.git.commands.status).argument().run();
				verify(status).entries.length.is(1);
				verify(status).entries[0].code.is("R ");
				verify(status).entries[0].path.is("b");
				verify(status).entries[0].orig_path.is("a");
				jsh.shell.console(JSON.stringify(status));
			};

			/**
			 * Verifies the behavior of various operations that affect the git staging area.
			 */
			fifty.tests.world.staging = function() {
				function status() {
					return it.api.command(jsh.tools.git.commands.status).argument().run();
				}

				var it = fixtures.empty();
				fixtures.edit(it, "a", $api.fp.returning("a"));
				fixtures.edit(it, "b", $api.fp.returning("b"));
				it.api.command(add).argument("a").run();
				verify(status(), "status", function(it) {
					it.paths.a.is("A ");
					it.paths.b.is("??");
				});
				it.api.command(add).argument("b").run();
				it.api.command(commit).argument({ message: "1" }).run();
				fixtures.edit(it, "a", $api.fp.returning("aa"));
				fixtures.edit(it, "b", $api.fp.returning("bb"));
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
			status: Command<{ cached?: boolean, recursive?: boolean }, { sha1: string, path: string }[]>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;
			const subject = jsh.tools.git.commands;

			fifty.tests.manual.submodule = {};
			fifty.tests.manual.submodule.status = function() {
				var repository = jsh.tools.git.program({ command: "git" }).repository(jsh.shell.PWD.toString());
				var submodules = repository.command(subject.submodule.status).argument({}).run();
				submodules.forEach(function(submodule) {
					jsh.shell.console("Path: " + submodule.path + " commit: " + submodule.sha1);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Commands {
		remote: {
			show: slime.jrunscript.tools.git.Command<string,{ head: string }>
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
