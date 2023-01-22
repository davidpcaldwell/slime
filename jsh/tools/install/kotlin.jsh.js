//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				replace: false
			}
		});
		jsh.shell.tools.kotlin.install(parameters.options, {
			console: function(e) {
				jsh.shell.console(e.detail);
			}
		});
	}
)();
