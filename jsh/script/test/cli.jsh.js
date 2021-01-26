//@ts-check
(
	/**
	 *
	 * @param { jsh } jsh
	 */
	function(jsh) {
		jsh.script.cli.wrap({
			commands: {
				status: function(p) {
					if (p.arguments.length == 0) return 0;
					if (p.arguments.length > 1) return -1;
					return Number(p.arguments[0]);
				}
			}
		});
	}
//@ts-ignore
)(jsh);