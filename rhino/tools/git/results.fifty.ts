//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * A script providing common implementations for parsing `git` output.
 */
namespace slime.jrunscript.tools.git.internal.results {
	export type Context = void;

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const script: Script = fifty.$loader.script("results.js");
			return script();
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		config: {
			list: (output: string) => { name: string, value: string }[]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}

			const { $api, jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.manual = {};
			fifty.tests.manual.slime = function() {
				var list: slime.jrunscript.shell.run.Intention = {
					command: "git",
					arguments: ["config", "--list"],
					directory: fifty.jsh.file.relative("../../..").pathname,
					stdio: {
						output: "string"
					}
				};
				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					list
				);
				jsh.shell.console(result.stdio.output);
				var parsed = subject.config.list(result.stdio.output);
				jsh.shell.console(JSON.stringify(parsed,void(0),4));
			};
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
