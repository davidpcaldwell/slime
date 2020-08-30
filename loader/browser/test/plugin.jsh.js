//@ts-check
(
	/**
	 * @param { jsh } jsh
	 * @param { jsh.plugin.$slime } $slime
	 * @param { jsh.plugin.plugin } plugin
	 */
	function(jsh,$slime,plugin) {
		plugin({
			isReady: function() {
				return Boolean($slime.typescript);
			},
			load: function() {
				jsh.typescript = $slime.typescript;
			}
		})
	}
//@ts-ignore
)(jsh,$slime,plugin);