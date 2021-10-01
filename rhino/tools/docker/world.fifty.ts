//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.kubectl {
	(
		function(
			fifty: slime.fifty.test.kit
		) {

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
