//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				repository: jsh.file.Pathname
			}
		});

		if (!parameters.options.repository.directory) {
			jsh.shell.console("Required: -repository that exists as directory.");
			jsh.shell.exit(1);
		}

		if (!parameters.options.repository.directory.getSubdirectory(".hg")) {
			jsh.shell.console("Required: -repository that is a Mercurial repository.");
			jsh.shell.exit(1);
		}

		var repository = new jsh.tools.hg.Repository({ directory: parameters.options.repository.directory });
		var subs = repository.subrepositories();
		debugger;
		jsh.shell.console("Result after debugger ...");
		(function() {
			for (var x in subs) {
				jsh.shell.console(x + " = " + subs[x].repository + " at " + subs[x].revision);
			}
		})();
	}
)();
