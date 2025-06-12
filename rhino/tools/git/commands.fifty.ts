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
	//	We try to keep the command order in sync with the order in https://git-scm.com/docs, and within categories, in CRUD order.

	export namespace command {
		export namespace status {
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
		}
	}

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
				var it = fixtures.Repository.from.empty({ initialBranch: "main" });
				jsh.shell.console(it.toString());

				var status = it.api.command(subject.status).argument().run();
				verify(status).branch.is("main");
				verify(status).evaluate.property("paths").is(void(0));
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
				var it = fixtures.Repository.from.empty();
				it.api.configure();

				fixtures.edit(it, "a", function(before) { return "a"; });
				it.api.command(add).argument("a").run();
				it.api.command(fixtures.commands.commit).argument({ message: "a" }).run();

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

				var it = fixtures.Repository.from.empty();
				fixtures.edit(it, "a", $api.fp.returning("a"));
				fixtures.edit(it, "b", $api.fp.returning("b"));
				it.api.command(add).argument("a").run();
				verify(status(), "status", function(it) {
					it.paths.a.is("A ");
					it.paths.b.is("??");
				});
				it.api.command(add).argument("b").run();
				it.api.command(fixtures.commands.commit).argument({ message: "1" }).run();
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
			};

			fifty.tests.world.lsFiles = function() {
				var commands: {
					lsFilesOther: slime.jrunscript.tools.git.Command<void,string[]>
				} = {
					lsFilesOther: {
						invocation: function(p) {
							return {
								command: "ls-files",
								arguments: ["--others", "--exclude-standard"]
							}
						},
						result: function(output) {
							return output.split("\n").filter(Boolean);
						}
					}
				};

				var it = fixtures.Repository.from.empty();
				fixtures.edit(it, "a", $api.fp.mapAllTo("a"));
				it.api.command(add).argument("a").run();
				it.api.command(fixtures.commands.commit).argument({ message: "1" });

				//	TODO	should recurseSubmodules have a default?
				var before = {
					list: it.api.command(subject.lsFiles).argument({ recurseSubmodules: false }).run(),
					others: it.api.command(commands.lsFilesOther).argument().run()
				};
				verify(before).list.length.is(1);
				verify(before).others.length.is(0);

				fixtures.edit(it, "b", $api.fp.mapAllTo("b"));
				var touch = {
					list: it.api.command(subject.lsFiles).argument({ recurseSubmodules: false }).run(),
					others: it.api.command(commands.lsFilesOther).argument().run()
				};
				verify(touch).list.length.is(1);
				verify(touch).others.length.is(1);

				it.api.command(add).argument("b").run();
				var added = {
					list: it.api.command(subject.lsFiles).argument({ recurseSubmodules: false }).run(),
					others: it.api.command(commands.lsFilesOther).argument().run()
				};
				verify(added).list.length.is(2);
				verify(added).others.length.is(0);

				it.api.command(fixtures.commands.commit).argument({ message: "2" }).run();
				var after = {
					list: it.api.command(subject.lsFiles).argument({ recurseSubmodules: false }).run(),
					others: it.api.command(commands.lsFilesOther).argument().run()
				};
				verify(after).list.length.is(2);
				verify(after).others.length.is(0);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Commands {
		log: Command<{ revisionRange: string },Commit[]>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual.log = function() {
				var slime = fifty.jsh.file.relative("../../..").pathname;

				const log: slime.jrunscript.tools.git.Command<{ revisionRange: string },Commit[]> = {
					invocation: function(p) {
						return {
							command: "log",
							arguments: $api.Array.build(function(rv) {
								rv.push(jsh.tools.git.log.format.argument);
								rv.push(p.revisionRange);
							})
						}
					},
					result: function(output) {
						return output.split("\n").map(function(line) {
							if (line.length == 0) return null;
							return jsh.tools.git.log.format.parse(line);
						}).filter(function(commit) {
							return Boolean(commit && commit.subject);
						})
					}
				}

				var commits = jsh.tools.git.program({ command: "git" }).repository( slime ).command(log).argument({ revisionRange: "HEAD^^^^^^^^^^..HEAD"}).run();
				jsh.shell.console(JSON.stringify(commits,void(0),4));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Commands {
		merge: Command<{ name: string }, void>
	}

	export interface Commands {
		fetch: Command<void,void>
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
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const subject = jsh.tools.git.commands;
			const { fixtures } = internal.commands.test;

			var add: slime.jrunscript.tools.git.Command<{ files: string[] },void> = {
				invocation: function(p) {
					return {
						command: "add",
						arguments: p.files
					}
				}
			};

			var submodule_add: slime.jrunscript.tools.git.Command<{ repository: string, path: string, branch: string },void> = {
				invocation: function(p) {
					return {
						command: "submodule",
						arguments: $api.Array.build(function(rv) {
							rv.push("add");
							rv.push("-b", p.branch);
							rv.push(p.repository);
							rv.push(p.path);
						})
					}
				}
			}

			var newEmptyRepository = function() {
				var rv = internal.commands.test.fixtures.Repository.from.empty({ initialBranch: "main" });
				rv.api.configure();
				return rv;
			}

			var addSubmodule = function(parent: test.fixtures.Repository, path: string, child: test.fixtures.Repository) {
				jsh.tools.git.program({ command: "git" })
					.config({ "protocol.file.allow": "always" })
					.repository( parent.location )
					.command(submodule_add)
					.argument({ repository: child.location, path: path, branch: "main" })
					.run()
				;
			}

			fifty.tests.exports.submodule = function() {
				var parent = internal.commands.test.fixtures.Repository.from.empty({ initialBranch: "main" });
				parent.api.configure();
				//	TODO	this apparently cannot be specified on the repository level, at least for git submodule add
				//parent.api.command(internal.commands.test.fixtures.commands.config.set).argument({ name: "protocol.file.allow", value: "always" }).run();
				var child = internal.commands.test.fixtures.Repository.from.empty({ initialBranch: "main" });
				child.api.configure();
				fixtures.edit(
					child,
					"a",
					$api.fp.Mapping.all("a")
				);
				child.api.command(add).argument({ files: ["a"] }).run();
				child.api.command(fixtures.commands.commit).argument({ message: "it" }).run();
				var result = parent.api.command(subject.submodule.status).argument({}).run();
				verify(result).length.is(0);

				addSubmodule(parent, "path", child);

				result = parent.api.command(subject.submodule.status).argument({}).run();
				verify(result).length.is(1);
				verify(result)[0].sha1.is.type("string");
				verify(result)[0].path.is("path");
				jsh.shell.console(JSON.stringify(result));
			};

			fifty.tests.manual.submodule = {};

			fifty.tests.manual.submodule.status = function() {
				var repository = jsh.tools.git.program({ command: "git" }).repository(jsh.shell.PWD.toString());
				var submodules = repository.command(subject.submodule.status).argument({}).run();
				submodules.forEach(function(submodule) {
					jsh.shell.console("Path: " + submodule.path + " commit: " + submodule.sha1);
				});
			}

			fifty.tests.manual.submodule.nested = function() {
				var top = newEmptyRepository();
				var child = newEmptyRepository();
				var grandchild = newEmptyRepository();

				fixtures.edit(
					grandchild,
					"file",
					$api.fp.Mapping.all("file")
				);
				grandchild.api.command(add).argument({ files: ["file"] }).run();
				grandchild.api.command(fixtures.commands.commit).argument({ message: "message" }).run();

				addSubmodule(child, "b", grandchild);
				child.api.command(fixtures.commands.commit).argument({ message: "child" }).run();
				jsh.shell.console("Child: " + child.location);

				addSubmodule(top, "a", child);
				top.api.command(fixtures.commands.commit).argument({ message: "parent" }).run();
				jsh.shell.console("Parent: " + top.location);

				var flat = top.api.command(subject.submodule.status).argument({}).run();
				var nested = top.api.command(subject.submodule.status).argument({ recursive: true }).run();
				jsh.shell.console(JSON.stringify(flat));
				jsh.shell.console(JSON.stringify(nested));
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace commands {
		export namespace remote {
			export namespace show {
				export interface Result {
					/**
					 * The default branch for this remote, as indicated by "HEAD branch:" in the `git` output.
					 */
					head: string
				}
			}
		}
	}

	export interface Commands {
		remote: {
			show: slime.jrunscript.tools.git.Command<string,commands.remote.show.Result>
		}
	}

	export interface Commands {
		lsFiles: slime.jrunscript.tools.git.Command<{ recurseSubmodules: boolean },string[]>
	}
}

namespace slime.jrunscript.tools.git.internal.commands {
	export interface Context {
		log: slime.jrunscript.tools.git.internal.log.Exports
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

	export type Script = slime.loader.Script<Context,slime.jrunscript.tools.git.Commands>
}
