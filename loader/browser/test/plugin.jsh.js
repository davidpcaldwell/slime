//@ts-check
(
	/**
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.jsh.plugin.plugin } plugin
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