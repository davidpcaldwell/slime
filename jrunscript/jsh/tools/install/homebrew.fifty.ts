//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.homebrew {
	export interface Installation {
		pathname: string
	}

	export interface Invocation {
		command: string
		arguments?: string[]
		environment?: {
			[x: string]: string
		}
	}

	export interface Command<P,R> {
		invocation: (p: P) => Invocation
		result: (output: string) => R
	}

	export interface Events {
		stdout: string
		stderr: string
	}

	export namespace object {
		export interface Installation {
			directory: slime.jrunscript.file.Directory
			update: () => void
			install: (p: { formula: string }) => void
			upgrade: (p: { formula: string }) => void

			command: <P,R>(command: Command<P,R>) => {
				parameters: (p: P) => {
					run: slime.$api.fp.world.old.Ask<Events, R>
				}
			}
		}
	}

	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			http: slime.jrunscript.http.client.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Interface {
		command: <P,R>(command: Command<P,R>) => slime.$api.fp.world.Meter<P,Events,R>
	}

	export interface Exports {
		/**
		 * Returns a Homebrew installation at the given location, creating the directory (and ancestors, if necessary), and
		 * installing Homebrew if necessary.
		 */
		get: (p: { location: slime.jrunscript.file.Pathname }) => object.Installation

		commands: {
			install: Command<{
				formula: string
			},string>

			list: Command<void,string[]>
		}

		Installation: {
			require: (installation: Installation) => Interface
		}
	}

	export type Script = slime.loader.Script<Context,Exports>

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;
			var script: Script = fifty.$loader.script("homebrew.js");
			return script({
				library: {
					file: jsh.file,
					http: jsh.http,
					shell: jsh.shell
				}
			});
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
			}

			fifty.tests.manual = {};

			fifty.tests.manual.old = function() {
				if (!jsh.shell.environment.TEST_HOMEBREW_PREFIX) {
					jsh.shell.console("Required: TEST_HOMEBREW_PREFIX");
					return;
				}
				var existing = test.subject.get({ location: jsh.file.Pathname(jsh.shell.environment.TEST_HOMEBREW_PREFIX) });
				var output = existing.command(test.subject.commands.list).parameters().run({
					stderr: function(e) {
						jsh.shell.console(e.detail);
					}
				});
				jsh.shell.console(JSON.stringify(output));
			};

			fifty.tests.manual.wo = {};

			fifty.tests.manual.wo.blank = function() {
				var TMP = fifty.jsh.file.temporary.location();
				var i: Installation = {
					pathname: TMP.pathname
				};
				var created = test.subject.Installation.require(i);
				jsh.shell.console("Created: " + TMP.pathname);
			}

			fifty.tests.manual.wo.install = function() {
				if (!jsh.shell.environment.TEST_HOMEBREW_PREFIX) {
					jsh.shell.console("Required: TEST_HOMEBREW_PREFIX");
					return;
				}
				var i: Installation = {
					pathname: jsh.shell.environment.TEST_HOMEBREW_PREFIX
				};
				var created = test.subject.Installation.require(i);
				var install = $api.fp.world.now.question(
					created.command(test.subject.commands.install),
					{ formula: "wget" },
					{
						stdout: function(e) {
							jsh.shell.console("STDOUT: " + e.detail);
						},
						stderr: function(e) {
							jsh.shell.console("STDERR: " + e.detail);
						}
					}
				);
				jsh.shell.console("install output: " + install);
				var list = $api.fp.world.now.question(
					created.command(test.subject.commands.list),
					void(0)
				);
				jsh.shell.console("list: " + JSON.stringify(list));
			}
		}
	//@ts-ignore
	)(fifty);
}
