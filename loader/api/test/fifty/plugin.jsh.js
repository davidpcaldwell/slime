//@ts-check
(
	/**
	 *
	 * @param { jsh } jsh
	 * @param { jsh.plugin.$slime } $slime
	 * @param { jsh.plugin.plugin } plugin
	 */
	function(jsh,$slime,plugin) {
		plugin({
			load: function() {
				jsh.$fifty = {
					plugin: {
						mock: function(p) {
							return $slime.plugins.mock(p);
						}
					}
				};
			}
		})
	}
//@ts-ignore
)(jsh,$slime,plugin);