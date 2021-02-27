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
