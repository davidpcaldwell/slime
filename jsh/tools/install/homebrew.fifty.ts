//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.homebrew {
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

	export interface Context {
		library: {
			http: slime.jrunscript.http.client.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Exports {
		/**
		 * Returns a Homebrew installation at the given location, creating the directory (and ancestors, if necessay), and
		 * installing Homebrew if necessary.
		 */
		get: (p: { location: slime.jrunscript.file.Pathname }) => Installation

		commands: {
			install: Command<{
				formula: string
			},string>

			list: Command<void,string[]>
		}
	}

	export type Script = slime.loader.Script<Context,Exports>

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;
			var script: Script = fifty.$loader.script("homebrew.js");
			return script({
				library: {
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
			const { jsh } = fifty.global;

			fifty.tests.suite = function() {
			}

			fifty.tests.manual = function() {
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
			}
		}
	//@ts-ignore
	)(fifty);
}
