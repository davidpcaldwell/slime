//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		if (!jsh.shell.tools.node.version) {
			jsh.shell.console("Node not installed.");
			jsh.shell.exit(1);
		}

		$api.Function.result(
			jsh.shell.tools.node.modules.installed,
			$api.Function.Object.entries,
			function(entries) {
				entries.forEach(function(item) {
					jsh.shell.console(item[0] + ": " + item[1].version)
				})
			}
		)
	}
//@ts-ignore
)($api,jsh)
