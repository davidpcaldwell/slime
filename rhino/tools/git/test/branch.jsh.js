//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var parameters = jsh.script.getopts({
			options: {
				repository: jsh.file.Pathname
			}
		});

		var repository = jsh.tools.git.Repository({ directory: parameters.options.repository.directory });
		var branches = repository.branch();
		branches.forEach(function(branch,index) {
			if (index) jsh.shell.console("");
			jsh.shell.console(branch.name + " (current: " + branch.current + ") commit=" + JSON.stringify(branch.commit));
		});
	}
//@ts-ignore
)(jsh)
