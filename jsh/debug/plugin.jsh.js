plugin({
	isReady: function() {
		return true;
	},
	load: function() {
		jsh.debug = $loader.module("module.js");

		jsh.debug.disableBreakOnExceptionsFor = function(f) {
			return function() {
				var enabled = $host.getDebugger().isBreakOnExceptions();
				if (enabled) {
					$host.getDebugger().setBreakOnExceptions(false);
				}
				try {
					return f.apply(this,arguments);
				} finally {
					if (enabled) {
						$host.getDebugger().setBreakOnExceptions(true);
					}
				}
			}
		}
	}
})