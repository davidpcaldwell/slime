//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git {
	export interface Commit {
		names: string[],
		commit: { hash: string },
		author: { name: string, email: string, date: any },
		committer: { name: string, email: string, date: any },
		subject: string
	}

	export interface Exports {
		log: {
			format: {
				/**
				 * The mask to use for formatting `git` log messages, compatible with the `parse` method.
				 */
				mask: string

				/**
				 * The full argument to pass to `git log` for formatting, including `--format:format=`.
				 */
				argument: string

				/**
				 * Given a line emitted using the configured format mask, returns a parsed {@link Commit} representing the commit.
				 */
				parse: (line: string) => Commit
			}
		}
	}
}

namespace slime.jrunscript.tools.git.internal.log {
	export interface Context {
		library: {
			time: slime.time.Exports
		}
	}

	export interface Exports {
		format: slime.jrunscript.tools.git.Exports["log"]["format"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
