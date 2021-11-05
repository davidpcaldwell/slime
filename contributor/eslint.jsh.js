//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				project: jsh.shell.jsh.src.pathname
			}
		});

		jsh.shell.tools.node.require();
		jsh.shell.tools.node.modules.require({ name: "eslint" });

		jsh.shell.tools.node.run({
			command: "eslint",
			arguments: [/*"--debug",*/ "."],
			directory: parameters.options.project.directory,
			evaluate: function(result) {
				jsh.shell.exit(result.status);
			}
		});
	}
)();
