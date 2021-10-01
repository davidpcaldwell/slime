//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.docker.kubectl {
	export namespace test {
		export const subject: Export = (function(fifty: slime.fifty.test.kit) {
			return fifty.$loader.module("module.js");
		//@ts-ignore
		})(fifty)
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				fifty.verify(test).subject.is.type("object");

				var installation = test.subject.kubectl.Installation({ command: "kubectl" });
				var environment = installation.Environment.create({
					environment: fifty.global.jsh.shell.environment,
					stdio: fifty.global.jsh.shell.stdio,
					directory: fifty.global.jsh.shell.PWD.toString()
				});
				var run = environment.Invocation.create(
					test.subject.kubectl.Invocation.toJson({
						command: "config",
						subcommand: "view",
						stdio: {
							error: "line"
						}
					})
				);
				var postprocessor = test.subject.kubectl.result(fifty.global.jsh.shell.world, run);
				var result = postprocessor({
					stderr: function(e) {
						fifty.global.jsh.shell.console("STDERR: [" + e.detail.line + "]");
					}
				});
				fifty.global.jsh.shell.console(JSON.stringify(result,void(0),4));
			}
		}
	//@ts-ignore
	)(fifty);
}
