//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.docker {
	namespace cli {
		interface Invocation {
			command: string[]
			arguments: string[]
		}

		export interface Interface {
			exec: (p: {
				interactive: boolean
				tty: boolean
				container: string
				command: string
				arguments: string[]
			}) => Invocation

			shell: (p: Invocation) => slime.jrunscript.shell.invocation.Argument
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.cli = {};
			fifty.tests.cli.exec = function() {
				var invocation = test.subject.cli.exec({
					interactive: true,
					tty: true,
					container: "CONTAINER",
					command: "COMMAND",
					arguments: [
						"--foo", "bar"
					]
				});
				fifty.verify(invocation).command.evaluate(function(p) { return p.toString(); }).is("exec");
				fifty.verify(invocation).arguments[0].is("--interactive");
				fifty.verify(invocation).arguments[1].is("--tty");
				fifty.verify(invocation).arguments[2].is("CONTAINER");
				fifty.verify(invocation).arguments[3].is("COMMAND");
				fifty.verify(invocation).arguments[4].is("--foo");
				fifty.verify(invocation).arguments[5].is("bar");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Engine {
		cli: cli.Interface
	}

	export namespace test {
		export const subject: Engine = (function(fifty: slime.fifty.test.kit) {
			return fifty.$loader.module("module.js");
		//@ts-ignore
		})(fifty)
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.cli.exec);
			}
		}
	//@ts-ignore
	)(fifty);
}
