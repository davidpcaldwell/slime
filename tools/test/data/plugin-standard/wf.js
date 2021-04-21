//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.wf.cli.Context } $context
	 * @param { slime.jsh.wf.standard.Interface } $exports
	 */
	function(jsh,$context,$exports) {
		jsh.wf.cli.initialize(
			$context,
			{
				test: function() {
					return true;
				}
			},
			$exports
		);
	}
//@ts-ignore
)(jsh,$context,$exports);
