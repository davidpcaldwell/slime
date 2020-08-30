//@ts-check
(
	/**
	 * @param { jsh.plugin.$slime } $slime
	 * @param { jsh.plugin.plugin } plugin
	 */
	function($slime,plugin) {
		plugin({
			isReady: function() {
				return true;
			},
			load: function() {
				//	provide an API that allows compiling TypeScript using $slime object
				//	Packages.java.lang.System.err.println("in loader/browser/test jsh plugin, $slime.typescript = " + $slime.typescript);
			}
		})
	}
//@ts-ignore
)($slime,plugin);