//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.kubectl {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.docker = function() {
				var isRunning = fifty.global.jsh.tools.docker.engine.isRunning();
				fifty.global.jsh.shell.console("Docker running?: " + isRunning);
				if (isRunning) {
					var containerListAll: slime.jrunscript.tools.docker.cli.Command<void,object[]> = {
						invocation: function() {
							return {
								command: ["container", "ls"],
								arguments: [
									"-a"
								]
							}
						},
						output: {
							json: true,
							truncated: true
						},
						result: function(json) {
							return json;
						}
					};
					var result = fifty.global.jsh.tools.docker.engine.cli.command(containerListAll).input().run({
						stderr: function(e) {
							if (e.detail) fifty.global.jsh.shell.console("STDERR: [" + e.detail + "]");
						}
					});
					fifty.global.jsh.shell.console(JSON.stringify(result,void(0),4));
				}
			}

			fifty.tests.suite = function() {
				var ask = fifty.global.jsh.tools.kubectl.json({
					command: "config",
					subcommand: "view",
					stdio: {
						error: "line"
					}
				});
				var result = ask({
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
