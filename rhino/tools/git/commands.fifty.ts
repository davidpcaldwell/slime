//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git.internal.commands {
	export namespace test {
		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;

			var program = jsh.tools.git.program({ command: "git" });

			var init: slime.jrunscript.tools.git.Command<void,void> = {
				invocation: function(p) {
					return {
						command: "init"
					}
				}
			}

			function empty() {
				var tmp = fifty.jsh.file.temporary.directory();
				var repository = jsh.tools.git.program({ command: "git" }).repository(tmp.pathname);
				repository.command(init).argument().run();
				repository.toString = function() {
					return tmp.pathname;
				};
				return repository;
			}

			return {
				program,
				empty
			};
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);
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
			const { jsh } = fifty.global;
			const subject = jsh.tools.git.commands;
			const fixtures = internal.commands.test.fixtures;

			fifty.tests.exports.status = {};

			fifty.tests.exports.status.uninitialized = function() {
				var directory = fifty.jsh.file.temporary.directory();

				var command = fixtures.program.repository(directory.pathname).command(subject.status).argument();
				verify(command).evaluate(function(command) { return command.run(); }).threw.type(Error);
			};

			fifty.tests.exports.status.empty = function() {
				var it = fixtures.empty();
				jsh.shell.console(it.toString());

				var status = it.command(subject.status).argument().run();
				verify(status).branch.is("master");
				verify(status).evaluate.property("paths").is(void(0));
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
