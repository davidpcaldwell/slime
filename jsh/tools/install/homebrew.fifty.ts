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
				run: slime.$api.fp.impure.Ask<Events, R>
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
		 * Returns a Homebrew installation at the given location, creating the directory and installing Homebrew if necessary.
		 */
		get: (p: { location: slime.jrunscript.file.Pathname }) => Installation

		commands: {
			install: Command<{
				formula: string
			},string>
		}
	}

	export type Script = slime.loader.Script<Context,Exports>

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
			}
		}
	//@ts-ignore
	)(fifty);
}
